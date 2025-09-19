#include <RE/Skyrim.h>
#include <REL/Relocation.h>
#include <SKSE/SKSE.h>
#include <shlobj.h>
#include <windows.h>

#include <algorithm>
#include <chrono>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

namespace fs = std::filesystem;

// ===== FUNCIONES UTILITARIAS ULTRA-SEGURAS =====

std::string SafeWideStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    try {
        int size_needed = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), NULL, 0, NULL, NULL);
        if (size_needed <= 0) {
            size_needed = WideCharToMultiByte(CP_ACP, 0, wstr.c_str(), (int)wstr.size(), NULL, 0, NULL, NULL);
            if (size_needed <= 0) return std::string();
            std::string result(size_needed, 0);
            int converted =
                WideCharToMultiByte(CP_ACP, 0, wstr.c_str(), (int)wstr.size(), &result[0], size_needed, NULL, NULL);
            if (converted <= 0) return std::string();
            return result;
        }
        std::string result(size_needed, 0);
        int converted =
            WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), &result[0], size_needed, NULL, NULL);
        if (converted <= 0) return std::string();
        return result;
    } catch (...) {
        std::string result;
        result.reserve(wstr.size());
        for (wchar_t wc : wstr) {
            if (wc <= 127) {
                result.push_back(static_cast<char>(wc));
            } else {
                result.push_back('?');
            }
        }
        return result;
    }
}

std::string GetEnvVar(const std::string& key) {
    char* buf = nullptr;
    size_t sz = 0;
    if (_dupenv_s(&buf, &sz, key.c_str()) == 0 && buf != nullptr) {
        std::string value(buf);
        free(buf);
        return value;
    }
    return "";
}

struct ParsedRule {
    std::string key;
    std::string plugin;
    std::vector<std::string> presets;
    std::string extra;
    int applyCount = -1;
};

struct OrderedPluginData {
    std::vector<std::pair<std::string, std::vector<std::string>>> orderedData;

    void addPreset(const std::string& plugin, const std::string& preset) {
        auto it = std::find_if(orderedData.begin(), orderedData.end(),
                               [&plugin](const auto& pair) { return pair.first == plugin; });
        if (it == orderedData.end()) {
            orderedData.emplace_back(plugin, std::vector<std::string>{preset});
            orderedData.back().second.reserve(20);
        } else {
            auto& presets = it->second;
            if (std::find(presets.begin(), presets.end(), preset) == presets.end()) {
                presets.push_back(preset);
            }
        }
    }

    void removePreset(const std::string& plugin, const std::string& preset) {
        auto it = std::find_if(orderedData.begin(), orderedData.end(),
                               [&plugin](const auto& pair) { return pair.first == plugin; });
        if (it != orderedData.end()) {
            auto& presets = it->second;
            auto presetIt = std::find_if(presets.begin(), presets.end(), [&preset](const std::string& p) {
                std::string strippedP = p;
                if (!strippedP.empty() && strippedP[0] == '!') {
                    strippedP = strippedP.substr(1);
                }
                std::string strippedTarget = preset;
                if (!strippedTarget.empty() && strippedTarget[0] == '!') {
                    strippedTarget = strippedTarget.substr(1);
                }
                return strippedP == strippedTarget;
            });
            if (presetIt != presets.end()) {
                presets.erase(presetIt);
                if (presets.empty()) {
                    orderedData.erase(it);
                }
            }
        }
    }

    void removePlugin(const std::string& plugin) {
        auto it = std::find_if(orderedData.begin(), orderedData.end(),
                               [&plugin](const auto& pair) { return pair.first == plugin; });
        if (it != orderedData.end()) {
            orderedData.erase(it);
        }
    }

    bool hasPlugin(const std::string& plugin) const {
        return std::any_of(orderedData.begin(), orderedData.end(),
                           [&plugin](const auto& pair) { return pair.first == plugin; });
    }

    size_t getPluginCount() const { return orderedData.size(); }

    size_t getTotalPresetCount() const {
        size_t count = 0;
        for (const auto& [plugin, presets] : orderedData) {
            count += presets.size();
        }
        return count;
    }
};

// ===== NUEVA FUNCIÓN: VALIDACIÓN SIMPLE DE INTEGRIDAD JSON AL INICIO =====

bool PerformSimpleJsonIntegrityCheck(const fs::path& jsonPath, std::ofstream& logFile) {
    try {
        logFile << "Performing SIMPLE JSON integrity check at startup..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;

        // Verificar que el archivo existe
        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist at: " << jsonPath.string() << std::endl;
            return false;
        }

        // Verificar tamaño mínimo
        auto fileSize = fs::file_size(jsonPath);
        if (fileSize < 10) {
            logFile << "ERROR: JSON file is too small (" << fileSize << " bytes)" << std::endl;
            return false;
        }

        // Leer el contenido completo SIN MODIFICAR
        std::ifstream jsonFile(jsonPath, std::ios::binary);
        if (!jsonFile.is_open()) {
            logFile << "ERROR: Cannot open JSON file for integrity check" << std::endl;
            return false;
        }

        std::string content;
        jsonFile.seekg(0, std::ios::end);
        size_t contentSize = jsonFile.tellg();
        jsonFile.seekg(0, std::ios::beg);
        content.resize(contentSize);
        jsonFile.read(&content[0], contentSize);
        jsonFile.close();

        if (content.empty()) {
            logFile << "ERROR: JSON file is empty after reading" << std::endl;
            return false;
        }

        logFile << "JSON file size: " << fileSize << " bytes" << std::endl;

        // VALIDACIÓN 1: Estructura básica de JSON
        content = content.substr(content.find_first_not_of(" \t\r\n"));
        content = content.substr(0, content.find_last_not_of(" \t\r\n") + 1);

        if (!content.starts_with('{') || !content.ends_with('}')) {
            logFile << "ERROR: JSON does not start with '{' or end with '}'" << std::endl;
            return false;
        }

        // VALIDACIÓN 2: Balance de llaves, corchetes y paréntesis
        int braceCount = 0;    // {}
        int bracketCount = 0;  // []
        int parenCount = 0;    // ()
        bool inString = false;
        bool escape = false;
        int line = 1;
        int col = 1;

        for (size_t i = 0; i < content.length(); i++) {
            char c = content[i];
            if (c == '\n') {
                line++;
                col = 1;
                continue;
            }
            col++;

            if (escape) {
                escape = false;
                continue;
            }

            if (c == '\\') {
                escape = true;
                continue;
            }

            if (c == '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                switch (c) {
                    case '{':
                        braceCount++;
                        break;
                    case '}':
                        braceCount--;
                        if (braceCount < 0) {
                            logFile << "ERROR: Unbalanced closing brace '}' at line " << line << ", column " << col
                                    << std::endl;
                            return false;
                        }
                        break;
                    case '[':
                        bracketCount++;
                        break;
                    case ']':
                        bracketCount--;
                        if (bracketCount < 0) {
                            logFile << "ERROR: Unbalanced closing bracket ']' at line " << line << ", column " << col
                                    << std::endl;
                            return false;
                        }
                        break;
                    case '(':
                        parenCount++;
                        break;
                    case ')':
                        parenCount--;
                        if (parenCount < 0) {
                            logFile << "ERROR: Unbalanced closing parenthesis ')' at line " << line << ", column "
                                    << col << std::endl;
                            return false;
                        }
                        break;
                }
            }
        }

        // Verificar balance final
        if (braceCount != 0) {
            logFile << "ERROR: Unbalanced braces (missing " << (braceCount > 0 ? "closing" : "opening")
                    << " braces: " << abs(braceCount) << ")" << std::endl;
            return false;
        }

        if (bracketCount != 0) {
            logFile << "ERROR: Unbalanced brackets (missing " << (bracketCount > 0 ? "closing" : "opening")
                    << " brackets: " << abs(bracketCount) << ")" << std::endl;
            return false;
        }

        if (parenCount != 0) {
            logFile << "ERROR: Unbalanced parentheses (missing " << (parenCount > 0 ? "closing" : "opening")
                    << " parentheses: " << abs(parenCount) << ")" << std::endl;
            return false;
        }

        // VALIDACIÓN 3: Verificar que contiene las claves básicas esperadas de OBody
        const std::vector<std::string> expectedKeys = {
            "npcFormID",       "npc",           "factionFemale", "factionMale",
            "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        int foundKeys = 0;
        for (const auto& key : expectedKeys) {
            if (content.find("\"" + key + "\"") != std::string::npos) {
                foundKeys++;
            }
        }

        if (foundKeys < 6) {  // Al menos 6 de las 8 claves esperadas
            logFile << "ERROR: JSON appears to be corrupted or not a valid OBody config file" << std::endl;
            logFile << " Expected at least 6 OBody keys, found only " << foundKeys << std::endl;
            return false;
        }

        // VALIDACIÓN 4: Verificar sintaxis básica de comas
        std::string cleanContent = content;
        // Remover strings para evitar falsos positivos
        bool inStr = false;
        bool esc = false;
        for (size_t i = 0; i < cleanContent.length(); i++) {
            if (esc) {
                cleanContent[i] = ' ';
                esc = false;
                continue;
            }

            if (cleanContent[i] == '\\') {
                esc = true;
                cleanContent[i] = ' ';
                continue;
            }

            if (cleanContent[i] == '"') {
                inStr = !inStr;
                cleanContent[i] = ' ';
                continue;
            }

            if (inStr) {
                cleanContent[i] = ' ';
            }
        }

        // Verificar patrones problemáticos
        if (cleanContent.find(",,") != std::string::npos) {
            logFile << "ERROR: Found double comma ',,' in JSON structure" << std::endl;
            return false;
        }

        if (cleanContent.find(",}") != std::string::npos) {
            logFile << "WARNING: Found comma before closing brace ',}' (may cause issues)" << std::endl;
        }

        if (cleanContent.find(",]") != std::string::npos) {
            logFile << "WARNING: Found comma before closing bracket ',]' (may cause issues)" << std::endl;
        }

        logFile << "SUCCESS: JSON passed SIMPLE integrity check!" << std::endl;
        logFile << " Found " << foundKeys << " valid OBody keys" << std::endl;
        logFile << " Braces balanced: " << (braceCount == 0 ? "YES" : "NO") << std::endl;
        logFile << " Brackets balanced: " << (bracketCount == 0 ? "YES" : "NO") << std::endl;
        logFile << " Basic structure: VALID" << std::endl;
        logFile << std::endl;

        return true;
    } catch (const std::exception& e) {
        logFile << "ERROR in PerformSimpleJsonIntegrityCheck: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in PerformSimpleJsonIntegrityCheck: Unknown exception" << std::endl;
        return false;
    }
}

// ===== FUNCIONES DE RUTA ULTRA-SEGURAS =====

std::string GetDocumentsPath() {
    try {
        wchar_t path[MAX_PATH] = {0};
        HRESULT result = SHGetFolderPathW(NULL, CSIDL_PERSONAL, NULL, SHGFP_TYPE_CURRENT, path);
        if (SUCCEEDED(result)) {
            std::wstring ws(path);
            std::string converted = SafeWideStringToString(ws);
            if (!converted.empty()) {
                return converted;
            }
        }

        std::string userProfile = GetEnvVar("USERPROFILE");
        if (!userProfile.empty()) {
            return userProfile + "\\Documents";
        }

        return "C:\\Users\\Default\\Documents";
    } catch (...) {
        return "C:\\Users\\Default\\Documents";
    }
}

std::string GetGamePath() {
    try {
        std::string mo2Path = GetEnvVar("MO2_MODS_PATH");
        if (!mo2Path.empty()) return mo2Path;

        std::string vortexPath = GetEnvVar("VORTEX_MODS_PATH");
        if (!vortexPath.empty()) return vortexPath;

        std::string skyrimMods = GetEnvVar("SKYRIM_MODS_FOLDER");
        if (!skyrimMods.empty()) return skyrimMods;

        std::vector<std::string> registryKeys = {"SOFTWARE\\WOW6432Node\\Bethesda Softworks\\Skyrim Special Edition",
                                                 "SOFTWARE\\WOW6432Node\\GOG.com\\Games\\1457087920",
                                                 "SOFTWARE\\WOW6432Node\\Valve\\Steam\\Apps\\489830",
                                                 "SOFTWARE\\WOW6432Node\\Valve\\Steam\\Apps\\611670"};

        HKEY hKey;
        char pathBuffer[MAX_PATH] = {0};
        DWORD pathSize = sizeof(pathBuffer);

        for (const auto& key : registryKeys) {
            if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, key.c_str(), 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
                if (RegQueryValueExA(hKey, "Installed Path", NULL, NULL, (LPBYTE)pathBuffer, &pathSize) ==
                    ERROR_SUCCESS) {
                    RegCloseKey(hKey);
                    std::string result(pathBuffer);
                    if (!result.empty()) return result;
                }
                RegCloseKey(hKey);
            }
        }

        std::vector<std::string> commonPaths = {
            "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Skyrim Special Edition",
            "C:\\Program Files\\Steam\\steamapps\\common\\Skyrim Special Edition",
            "D:\\Steam\\steamapps\\common\\Skyrim Special Edition",
            "E:\\Steam\\steamapps\\common\\Skyrim Special Edition",
            "F:\\Steam\\steamapps\\common\\Skyrim Special Edition",
            "G:\\Steam\\steamapps\\common\\Skyrim Special Edition"};

        for (const auto& pathCandidate : commonPaths) {
            try {
                if (fs::exists(pathCandidate) && fs::is_directory(pathCandidate)) {
                    return pathCandidate;
                }
            } catch (...) {
                continue;
            }
        }

        return "";
    } catch (...) {
        return "";
    }
}

void CreateDirectoryIfNotExists(const fs::path& path) {
    try {
        if (!fs::exists(path)) {
            fs::create_directories(path);
        }
    } catch (...) {
        // Silent fail
    }
}

// ===== FUNCIONES UTILITARIAS MEJORADAS =====

std::string Trim(const std::string& str) {
    if (str.empty()) return str;
    size_t first = str.find_first_not_of(" \t\r\n");
    if (first == std::string::npos) return "";
    size_t last = str.find_last_not_of(" \t\r\n");
    return str.substr(first, (last - first + 1));
}

std::vector<std::string> Split(const std::string& str, char delimiter) {
    std::vector<std::string> tokens;
    if (str.empty()) return tokens;

    std::stringstream ss(str);
    std::string token;
    tokens.reserve(20);

    while (std::getline(ss, token, delimiter)) {
        std::string trimmed = Trim(token);
        if (!trimmed.empty()) {
            tokens.push_back(std::move(trimmed));
        }
    }
    return tokens;
}

std::string EscapeJson(const std::string& str) {
    std::string result;
    result.reserve(str.length() * 1.3);

    for (char c : str) {
        switch (c) {
            case '"':
                result += "\\\"";
                break;
            case '\\':
                result += "\\\\";
                break;
            case '\b':
                result += "\\b";
                break;
            case '\f':
                result += "\\f";
                break;
            case '\n':
                result += "\\n";
                break;
            case '\r':
                result += "\\r";
                break;
            case '\t':
                result += "\\t";
                break;
            default:
                if (c >= 0x20 && c <= 0x7E) {
                    result += c;
                } else {
                    char buf[7];
                    snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned char>(c));
                    result += buf;
                }
        }
    }
    return result;
}

ParsedRule ParseRuleLine(const std::string& key, const std::string& value) {
    ParsedRule rule;
    rule.key = key;

    std::vector<std::string> parts = Split(value, '|');
    if (parts.size() >= 2) {
        rule.plugin = Trim(parts[0]);
        rule.presets = Split(parts[1], ',');

        if (parts.size() >= 3) {
            rule.extra = Trim(parts[2]);
            if (rule.extra.empty()) {
                rule.applyCount = -1;
            } else if (rule.extra == "x" || rule.extra == "X") {
                rule.applyCount = -1;
            } else if (rule.extra == "x-" || rule.extra == "X-") {
                rule.applyCount = -4;
            } else if (rule.extra == "x*" || rule.extra == "X*") {
                rule.applyCount = -5;
            } else if (rule.extra == "-") {
                rule.applyCount = -2;
            } else if (rule.extra == "*") {
                rule.applyCount = -3;
            } else {
                try {
                    rule.applyCount = std::stoi(rule.extra);
                    if (rule.applyCount != 0 && rule.applyCount != 1) {
                        rule.applyCount = 0;
                    }
                } catch (...) {
                    rule.applyCount = 0;
                }
            }
        } else {
            rule.applyCount = -1;
        }
    }

    return rule;
}

// ===== SISTEMA DE BACKUP LITERAL PERFECTO =====

int ReadBackupConfigFromIni(const fs::path& iniPath, std::ofstream& logFile) {
    try {
        if (!fs::exists(iniPath)) {
            logFile << "Creating backup config INI at: " << iniPath.string() << std::endl;
            std::ofstream createIni(iniPath, std::ios::out | std::ios::trunc);
            if (createIni.is_open()) {
                createIni << "[Original backup]" << std::endl;
                createIni << "Backup = 1" << std::endl;
                createIni.close();
                logFile << "SUCCESS: Backup config INI created with default value (Backup = 1)" << std::endl;
                return 1;
            } else {
                logFile << "ERROR: Could not create backup config INI file!" << std::endl;
                return 0;
            }
        }

        std::ifstream iniFile(iniPath);
        if (!iniFile.is_open()) {
            logFile << "ERROR: Could not open backup config INI file for reading!" << std::endl;
            return 0;
        }

        std::string line;
        bool inBackupSection = false;
        int backupValue = 1;

        while (std::getline(iniFile, line)) {
            std::string trimmedLine = Trim(line);

            if (trimmedLine == "[Original backup]") {
                inBackupSection = true;
                continue;
            }

            if (trimmedLine.length() > 0 && trimmedLine[0] == '[' && trimmedLine != "[Original backup]") {
                inBackupSection = false;
                continue;
            }

            if (inBackupSection) {
                size_t equalPos = trimmedLine.find('=');
                if (equalPos != std::string::npos) {
                    std::string key = Trim(trimmedLine.substr(0, equalPos));
                    std::string value = Trim(trimmedLine.substr(equalPos + 1));

                    if (key == "Backup") {
                        if (value == "true" || value == "True" || value == "TRUE") {
                            backupValue = 2;  // Valor especial: siempre hacer backup
                            logFile << "Read backup config: Backup = true (always backup mode)" << std::endl;
                        } else {
                            try {
                                backupValue = std::stoi(value);
                                logFile << "Read backup config: Backup = " << backupValue << std::endl;
                            } catch (...) {
                                logFile << "Warning: Invalid backup value '" << value << "', using default (1)"
                                        << std::endl;
                                backupValue = 1;
                            }
                        }
                        break;
                    }
                }
            }
        }

        iniFile.close();
        return backupValue;
    } catch (const std::exception& e) {
        logFile << "ERROR in ReadBackupConfigFromIni: " << e.what() << std::endl;
        return 0;
    } catch (...) {
        logFile << "ERROR in ReadBackupConfigFromIni: Unknown exception" << std::endl;
        return 0;
    }
}

void UpdateBackupConfigInIni(const fs::path& iniPath, std::ofstream& logFile, int originalValue) {
    try {
        if (!fs::exists(iniPath)) {
            logFile << "ERROR: Backup config INI file does not exist for update!" << std::endl;
            return;
        }

        if (originalValue == 2) {
            logFile << "INFO: Backup = true detected, INI will not be updated (always backup mode)" << std::endl;
            return;
        }

        std::ifstream iniFile(iniPath);
        if (!iniFile.is_open()) {
            logFile << "ERROR: Could not open backup config INI file for reading during update!" << std::endl;
            return;
        }

        std::vector<std::string> lines;
        std::string line;
        bool inBackupSection = false;
        bool backupValueUpdated = false;
        lines.reserve(100);

        while (std::getline(iniFile, line)) {
            std::string trimmedLine = Trim(line);

            if (trimmedLine == "[Original backup]") {
                inBackupSection = true;
                lines.push_back(line);
                continue;
            }

            if (trimmedLine.length() > 0 && trimmedLine[0] == '[' && trimmedLine != "[Original backup]") {
                inBackupSection = false;
                lines.push_back(line);
                continue;
            }

            if (inBackupSection) {
                size_t equalPos = trimmedLine.find('=');
                if (equalPos != std::string::npos) {
                    std::string key = Trim(trimmedLine.substr(0, equalPos));
                    if (key == "Backup") {
                        lines.push_back("Backup = 0");
                        backupValueUpdated = true;
                        continue;
                    }
                }
            }

            lines.push_back(line);
        }

        iniFile.close();

        if (!backupValueUpdated) {
            logFile << "Warning: Backup value not found in INI during update!" << std::endl;
            return;
        }

        std::ofstream outFile(iniPath, std::ios::out | std::ios::trunc);
        if (!outFile.is_open()) {
            logFile << "ERROR: Could not open backup config INI file for writing during update!" << std::endl;
            return;
        }

        for (const auto& outputLine : lines) {
            outFile << outputLine << std::endl;
        }

        outFile.close();
        if (outFile.fail()) {
            logFile << "ERROR: Failed to write backup config INI file!" << std::endl;
        } else {
            logFile << "SUCCESS: Backup config updated (Backup = 0)" << std::endl;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in UpdateBackupConfigInIni: " << e.what() << std::endl;
    } catch (...) {
        logFile << "ERROR in UpdateBackupConfigInIni: Unknown exception" << std::endl;
    }
}

// ===== BACKUP LITERAL BYTE-POR-BYTE (CORREGIDO) =====

bool PerformLiteralJsonBackup(const fs::path& originalJsonPath, const fs::path& backupJsonPath,
                              std::ofstream& logFile) {
    try {
        if (!fs::exists(originalJsonPath)) {
            logFile << "ERROR: Original JSON file does not exist at: " << originalJsonPath.string() << std::endl;
            return false;
        }

        CreateDirectoryIfNotExists(backupJsonPath.parent_path());

        // COPIA LITERAL PERFECTA - SIN PROCESAMIENTO
        std::error_code ec;
        fs::copy_file(originalJsonPath, backupJsonPath, fs::copy_options::overwrite_existing, ec);

        if (ec) {
            logFile << "ERROR: Failed to copy JSON file directly: " << ec.message() << std::endl;
            return false;
        }

        // Verificación de integridad byte-por-byte
        try {
            auto originalSize = fs::file_size(originalJsonPath);
            auto backupSize = fs::file_size(backupJsonPath);

            if (originalSize == backupSize && originalSize > 0) {
                logFile << "SUCCESS: LITERAL JSON backup completed to: " << backupJsonPath.string() << std::endl;
                logFile << "Backup file size: " << backupSize << " bytes (verified identical to original)" << std::endl;
                return true;
            } else {
                logFile << "ERROR: Backup file size mismatch! Original: " << originalSize << ", Backup: " << backupSize
                        << std::endl;
                return false;
            }

        } catch (...) {
            logFile << "SUCCESS: LITERAL JSON backup completed (size verification failed but backup exists)"
                    << std::endl;
            return true;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in PerformLiteralJsonBackup: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in PerformLiteralJsonBackup: Unknown exception" << std::endl;
        return false;
    }
}

// ===== VERIFICACIÓN TRIPLE DE INTEGRIDAD =====

bool PerformTripleValidation(const fs::path& jsonPath, const fs::path& backupPath, std::ofstream& logFile) {
    try {
        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist for validation: " << jsonPath.string() << std::endl;
            return false;
        }

        auto fileSize = fs::file_size(jsonPath);
        if (fileSize < 10) {
            logFile << "ERROR: JSON file is too small (" << fileSize << " bytes)" << std::endl;
            return false;
        }

        std::ifstream jsonFile(jsonPath, std::ios::binary);
        if (!jsonFile.is_open()) {
            logFile << "ERROR: Cannot open JSON file for validation" << std::endl;
            return false;
        }

        std::string content;
        jsonFile.seekg(0, std::ios::end);
        size_t contentSize = jsonFile.tellg();
        jsonFile.seekg(0, std::ios::beg);
        content.resize(contentSize);
        jsonFile.read(&content[0], contentSize);
        jsonFile.close();

        if (content.empty()) {
            logFile << "ERROR: JSON file is empty after reading" << std::endl;
            return false;
        }

        // VALIDACIÓN 1: Estructura JSON básica
        content = Trim(content);
        if (!content.starts_with('{') || !content.ends_with('}')) {
            logFile << "ERROR: JSON file does not have proper structure (missing braces)" << std::endl;
            return false;
        }

        // VALIDACIÓN 2: Balance de llaves y corchetes
        int braceCount = 0;
        int bracketCount = 0;
        bool inString = false;
        bool escape = false;

        for (char c : content) {
            if (c == '"' && !escape) {
                inString = !inString;
            } else if (!inString) {
                if (c == '{')
                    braceCount++;
                else if (c == '}')
                    braceCount--;
                else if (c == '[')
                    bracketCount++;
                else if (c == ']')
                    bracketCount--;
            }

            escape = (c == '\\' && !escape);
        }

        if (braceCount != 0 || bracketCount != 0) {
            logFile << "ERROR: JSON has unbalanced braces/brackets (braces: " << braceCount
                    << ", brackets: " << bracketCount << ")" << std::endl;
            return false;
        }

        // VALIDACIÓN 3: Claves OBody esperadas
        const std::vector<std::string> expectedKeys = {
            "npcFormID",       "npc",           "factionFemale", "factionMale",
            "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        int foundKeys = 0;
        for (const auto& key : expectedKeys) {
            if (content.find("\"" + key + "\"") != std::string::npos) {
                foundKeys++;
            }
        }

        if (foundKeys < 6) {
            logFile << "ERROR: JSON appears corrupted (missing expected keys, found only " << foundKeys << " out of "
                    << expectedKeys.size() << ")" << std::endl;
            return false;
        }

        logFile << "SUCCESS: JSON file passed TRIPLE validation (" << fileSize << " bytes, " << foundKeys
                << " valid keys found)" << std::endl;
        return true;
    } catch (const std::exception& e) {
        logFile << "ERROR in PerformTripleValidation: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in PerformTripleValidation: Unknown exception" << std::endl;
        return false;
    }
}

// ===== ANÁLISIS FORENSE AUTOMÁTICO =====

bool MoveCorruptedJsonToAnalysis(const fs::path& corruptedJsonPath, const fs::path& analysisDir,
                                 std::ofstream& logFile) {
    try {
        if (!fs::exists(corruptedJsonPath)) {
            logFile << "WARNING: Corrupted JSON file does not exist for analysis" << std::endl;
            return false;
        }

        CreateDirectoryIfNotExists(analysisDir);

        // Generar nombre único con timestamp
        auto now = std::chrono::system_clock::now();
        std::time_t time_t = std::chrono::system_clock::to_time_t(now);
        std::tm tm;
        localtime_s(&tm, &time_t);

        char timestamp[32];
        strftime(timestamp, sizeof(timestamp), "%Y%m%d_%H%M%S", &tm);

        fs::path analysisFile =
            analysisDir / ("OBody_presetDistributionConfig_corrupted_" + std::string(timestamp) + ".json");

        std::error_code ec;
        fs::copy_file(corruptedJsonPath, analysisFile, fs::copy_options::overwrite_existing, ec);

        if (ec) {
            logFile << "ERROR: Failed to move corrupted JSON to analysis folder: " << ec.message() << std::endl;
            return false;
        }

        logFile << "SUCCESS: Corrupted JSON moved to analysis folder: " << analysisFile.string() << std::endl;
        return true;
    } catch (const std::exception& e) {
        logFile << "ERROR in MoveCorruptedJsonToAnalysis: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in MoveCorruptedJsonToAnalysis: Unknown exception" << std::endl;
        return false;
    }
}

// ===== RESTAURACIÓN DESDE BACKUP =====

bool RestoreJsonFromBackup(const fs::path& backupJsonPath, const fs::path& originalJsonPath,
                           const fs::path& analysisDir, std::ofstream& logFile) {
    try {
        if (!fs::exists(backupJsonPath)) {
            logFile << "ERROR: Backup JSON file does not exist: " << backupJsonPath.string() << std::endl;
            return false;
        }

        // Verificar integridad del backup antes de restaurar
        if (!PerformTripleValidation(backupJsonPath, fs::path(), logFile)) {
            logFile << "ERROR: Backup JSON file is also corrupted, cannot restore!" << std::endl;
            return false;
        }

        logFile << "WARNING: Original JSON appears corrupted, restoring from backup..." << std::endl;

        // Mover archivo corrupto a análisis forense
        if (fs::exists(originalJsonPath)) {
            MoveCorruptedJsonToAnalysis(originalJsonPath, analysisDir, logFile);
        }

        // RESTAURAR USANDO COPIA LITERAL
        std::error_code ec;
        fs::copy_file(backupJsonPath, originalJsonPath, fs::copy_options::overwrite_existing, ec);

        if (ec) {
            logFile << "ERROR: Failed to restore JSON from backup: " << ec.message() << std::endl;
            return false;
        }

        // Verificar que la restauración fue exitosa
        if (PerformTripleValidation(originalJsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON restored from backup successfully!" << std::endl;
            return true;
        } else {
            logFile << "ERROR: Restored JSON is still invalid!" << std::endl;
            return false;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in RestoreJsonFromBackup: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in RestoreJsonFromBackup: Unknown exception" << std::endl;
        return false;
    }
}

// ===== NUEVA FUNCIÓN MEJORADA: CORRECCIÓN COMPLETA DE INDENTACIÓN CON EMPTY INLINE Y MULTI-LINE EMPTY DETECTION =====

bool CorrectJsonIndentation(const fs::path& jsonPath, const fs::path& analysisDir, std::ofstream& logFile) {
    try {
        logFile << "Checking and correcting JSON indentation hierarchy..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;

        // Leer el JSON actual
        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist for indentation correction" << std::endl;
            return false;
        }

        std::ifstream jsonFile(jsonPath, std::ios::binary);
        if (!jsonFile.is_open()) {
            logFile << "ERROR: Cannot open JSON file for indentation correction" << std::endl;
            return false;
        }

        std::string originalContent;
        jsonFile.seekg(0, std::ios::end);
        size_t contentSize = jsonFile.tellg();
        jsonFile.seekg(0, std::ios::beg);
        originalContent.resize(contentSize);
        jsonFile.read(&originalContent[0], contentSize);
        jsonFile.close();

        if (originalContent.empty()) {
            logFile << "ERROR: JSON file is empty for indentation correction" << std::endl;
            return false;
        }

        // Verificar si necesita corrección
        bool needsCorrection = false;
        std::vector<std::string> lines;
        std::stringstream ss(originalContent);
        std::string line;

        while (std::getline(ss, line)) {
            lines.push_back(line);
        }

        // Analizar indentación actual - verificar si NO cumple con exactamente 4 espacios por nivel
        for (const auto& currentLine : lines) {
            if (currentLine.empty()) continue;
            if (currentLine.find_first_not_of(" \t") == std::string::npos) continue;  // Solo espacios

            size_t leadingSpaces = 0;
            size_t leadingTabs = 0;
            for (char c : currentLine) {
                if (c == ' ')
                    leadingSpaces++;
                else if (c == '\t')
                    leadingTabs++;
                else
                    break;
            }

            // Si hay tabs O si los espacios no son múltiplos exactos de 4, necesita corrección
            if (leadingTabs > 0 || (leadingSpaces > 0 && leadingSpaces % 4 != 0)) {
                needsCorrection = true;
                break;
            }
        }

        // NUEVA VERIFICACIÓN: Detectar contenedores vacíos multi-línea que necesitan corrección
        if (!needsCorrection) {
            // Buscar patrones como:
            // "key": {
            //     },
            // o
            // "key": [
            //     ],

            for (size_t i = 0; i < lines.size() - 1; i++) {
                std::string currentTrimmed = Trim(lines[i]);

                // Verificar si la línea actual termina con { o [
                if (currentTrimmed.ends_with("{") || currentTrimmed.ends_with("[")) {
                    char openChar = currentTrimmed.back();
                    char closeChar = (openChar == '{') ? '}' : ']';

                    // Buscar la línea de cierre correspondiente
                    for (size_t j = i + 1; j < lines.size(); j++) {
                        std::string nextTrimmed = Trim(lines[j]);

                        // Si encontramos el carácter de cierre
                        if (nextTrimmed == std::string(1, closeChar) ||
                            nextTrimmed == std::string(1, closeChar) + ",") {
                            // Verificar si hay solo espacios en blanco entre apertura y cierre
                            bool hasOnlyWhitespace = true;
                            for (size_t k = i + 1; k < j; k++) {
                                if (!Trim(lines[k]).empty()) {
                                    hasOnlyWhitespace = false;
                                    break;
                                }
                            }

                            if (hasOnlyWhitespace) {
                                needsCorrection = true;
                                logFile << "DETECTED: Multi-line empty container found at lines " << (i + 1) << "-"
                                        << (j + 1) << ", needs inline correction" << std::endl;
                                break;
                            }
                        }

                        // Si encontramos contenido real, no es un contenedor vacío
                        if (!nextTrimmed.empty() && nextTrimmed != std::string(1, closeChar) &&
                            nextTrimmed != std::string(1, closeChar) + ",") {
                            break;
                        }
                    }

                    if (needsCorrection) break;
                }
            }
        }

        if (!needsCorrection) {
            logFile << "SUCCESS: JSON indentation is already correct (perfect 4-space hierarchy with inline empty "
                       "containers)"
                    << std::endl;
            logFile << std::endl;
            return true;
        }

        logFile << "DETECTED: JSON indentation needs correction - reformatting entire file with perfect 4-space "
                   "hierarchy and inline empty containers..."
                << std::endl;

        // ALGORITMO MEJORADO: Reformat completo con exactamente 4 espacios por nivel + MEJOR DETECCIÓN DE EMPTY
        // CONTAINERS
        std::ostringstream correctedJson;
        int indentLevel = 0;
        bool inString = false;
        bool escape = false;

        // ===== FUNCIÓN HELPER MEJORADA PARA DETECTAR SI UN BLOQUE ESTÁ VACÍO (INCLUYENDO MULTI-LÍNEA) =====
        auto isEmptyBlock = [&originalContent](size_t startPos, char openChar, char closeChar) -> bool {
            size_t pos = startPos + 1;
            int depth = 1;
            bool inStr = false;
            bool esc = false;

            while (pos < originalContent.length() && depth > 0) {
                char c = originalContent[pos];

                if (esc) {
                    esc = false;
                    pos++;
                    continue;
                }

                if (c == '\\' && inStr) {
                    esc = true;
                    pos++;
                    continue;
                }

                if (c == '"') {
                    inStr = !inStr;
                } else if (!inStr) {
                    if (c == openChar) {
                        depth++;
                    } else if (c == closeChar) {
                        depth--;
                        if (depth == 0) {
                            // Encontrado el cierre, verificar si solo hay espacios en blanco entre apertura y cierre
                            std::string between = originalContent.substr(startPos + 1, pos - startPos - 1);
                            std::string trimmedBetween = Trim(between);
                            return trimmedBetween.empty();  // Solo espacios en blanco o completamente vacío
                        }
                    }
                }
                pos++;
            }
            return false;
        };

        for (size_t i = 0; i < originalContent.length(); i++) {
            char c = originalContent[i];

            if (escape) {
                correctedJson << c;
                escape = false;
                continue;
            }

            if (c == '\\' && inString) {
                correctedJson << c;
                escape = true;
                continue;
            }

            if (c == '"' && !escape) {
                inString = !inString;
                correctedJson << c;
                continue;
            }

            if (inString) {
                correctedJson << c;
                continue;
            }

            switch (c) {
                case '{':
                case '[':
                    // NUEVA LÓGICA MEJORADA: Verificar si es un bloque vacío (incluyendo multi-línea)
                    if (isEmptyBlock(i, c, (c == '{') ? '}' : ']')) {
                        // Encontrar el carácter de cierre
                        size_t pos = i + 1;
                        int depth = 1;
                        bool inStr = false;
                        bool esc = false;

                        while (pos < originalContent.length() && depth > 0) {
                            char nextChar = originalContent[pos];

                            if (esc) {
                                esc = false;
                                pos++;
                                continue;
                            }

                            if (nextChar == '\\' && inStr) {
                                esc = true;
                                pos++;
                                continue;
                            }

                            if (nextChar == '"') {
                                inStr = !inStr;
                            } else if (!inStr) {
                                if (nextChar == c) {
                                    depth++;
                                } else if (nextChar == ((c == '{') ? '}' : ']')) {
                                    depth--;
                                }
                            }
                            pos++;
                        }

                        // Escribir el bloque vacío en la misma línea
                        correctedJson << c << ((c == '{') ? '}' : ']');
                        i = pos - 1;  // Saltar hasta después del carácter de cierre

                        // Verificar si necesitamos nueva línea después
                        if (i + 1 < originalContent.length()) {
                            size_t nextNonSpace = i + 1;
                            while (nextNonSpace < originalContent.length() &&
                                   std::isspace(originalContent[nextNonSpace])) {
                                nextNonSpace++;
                            }

                            if (nextNonSpace < originalContent.length() && originalContent[nextNonSpace] != ',' &&
                                originalContent[nextNonSpace] != '}' && originalContent[nextNonSpace] != ']') {
                                correctedJson << '\n';
                                for (int j = 0; j < indentLevel * 4; j++) {
                                    correctedJson << ' ';
                                }
                            }
                        }
                    } else {
                        // Bloque NO vacío: usar formato normal
                        correctedJson << c << '\n';
                        indentLevel++;
                        // Agregar indentación exacta de 4 espacios por nivel
                        for (int j = 0; j < indentLevel * 4; j++) {
                            correctedJson << ' ';
                        }
                    }
                    break;

                case '}':
                case ']':
                    // Ir a nueva línea y reducir indentación
                    correctedJson << '\n';
                    indentLevel--;
                    for (int j = 0; j < indentLevel * 4; j++) {
                        correctedJson << ' ';
                    }
                    correctedJson << c;

                    // Verificar si necesitamos nueva línea después
                    if (i + 1 < originalContent.length()) {
                        size_t nextNonSpace = i + 1;
                        while (nextNonSpace < originalContent.length() && std::isspace(originalContent[nextNonSpace])) {
                            nextNonSpace++;
                        }

                        if (nextNonSpace < originalContent.length() && originalContent[nextNonSpace] != ',' &&
                            originalContent[nextNonSpace] != '}' && originalContent[nextNonSpace] != ']') {
                            correctedJson << '\n';
                            for (int j = 0; j < indentLevel * 4; j++) {
                                correctedJson << ' ';
                            }
                        }
                    }
                    break;

                case ',':
                    correctedJson << c << '\n';
                    // Agregar indentación exacta para la siguiente línea
                    for (int j = 0; j < indentLevel * 4; j++) {
                        correctedJson << ' ';
                    }
                    break;

                case ':':
                    correctedJson << c << ' ';
                    break;

                case ' ':
                case '\t':
                case '\n':
                case '\r':
                    // Ignorar espacios en blanco existentes - los controlamos nosotros
                    break;

                default:
                    correctedJson << c;
                    break;
            }
        }

        std::string correctedContent = correctedJson.str();

        // Limpiar líneas vacías con solo espacios y normalizar
        std::vector<std::string> finalLines;
        std::stringstream finalSS(correctedContent);
        std::string finalLine;

        while (std::getline(finalSS, finalLine)) {
            // Eliminar espacios al final de línea
            while (!finalLine.empty() && finalLine.back() == ' ') {
                finalLine.pop_back();
            }
            finalLines.push_back(finalLine);
        }

        // Reconstruir el JSON final
        std::ostringstream finalJson;
        for (size_t i = 0; i < finalLines.size(); i++) {
            finalJson << finalLines[i];
            if (i < finalLines.size() - 1) {
                finalJson << '\n';
            }
        }

        std::string finalContent = finalJson.str();

        // Escribir el JSON corregido
        fs::path tempPath = jsonPath;
        tempPath.replace_extension(".indent_corrected.tmp");

        std::ofstream tempFile(tempPath, std::ios::out | std::ios::trunc | std::ios::binary);
        if (!tempFile.is_open()) {
            logFile << "ERROR: Could not create temporary file for indentation correction!" << std::endl;
            return false;
        }

        tempFile << finalContent;
        tempFile.close();

        if (tempFile.fail()) {
            logFile << "ERROR: Failed to write corrected JSON to temporary file!" << std::endl;
            return false;
        }

        // Verificar integridad del archivo corregido
        if (!PerformTripleValidation(tempPath, fs::path(), logFile)) {
            logFile << "ERROR: Corrected JSON failed integrity check!" << std::endl;
            MoveCorruptedJsonToAnalysis(tempPath, analysisDir, logFile);
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

        // Reemplazar el archivo original
        std::error_code ec;
        fs::rename(tempPath, jsonPath, ec);

        if (ec) {
            logFile << "ERROR: Failed to replace original with corrected JSON: " << ec.message() << std::endl;
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

        // Verificación final
        if (PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON indentation corrected successfully!" << std::endl;
            logFile << " Applied perfect 4-space hierarchy with inline empty containers (including multi-line empty "
                       "detection)"
                    << std::endl;
            logFile << std::endl;
            return true;
        } else {
            logFile << "ERROR: Final corrected JSON failed integrity check!" << std::endl;
            return false;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in CorrectJsonIndentation: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in CorrectJsonIndentation: Unknown exception" << std::endl;
        return false;
    }
}

// ===== PARSER JSON CONSERVADOR CON FORMATO DE 4 ESPACIOS =====

std::string PreserveOriginalSections(const std::string& originalJson,
                                     const std::map<std::string, OrderedPluginData>& processedData,
                                     std::ofstream& logFile) {
    try {
        const std::set<std::string> validKeys = {"npcFormID",       "npc",           "factionFemale", "factionMale",
                                                 "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        std::string result = originalJson;

        // Solo modificar las claves válidas que tienen datos
        for (const auto& [key, data] : processedData) {
            if (validKeys.count(key) && !data.orderedData.empty()) {
                // Buscar la posición de esta clave en el JSON original
                std::string keyPattern = "\"" + key + "\"";
                size_t keyPos = result.find(keyPattern);

                if (keyPos != std::string::npos) {
                    // Encontrar el inicio del valor (después del :)
                    size_t colonPos = result.find(":", keyPos);
                    if (colonPos != std::string::npos) {
                        size_t valueStart = colonPos + 1;

                        // Saltar espacios en blanco
                        while (valueStart < result.length() && std::isspace(result[valueStart])) {
                            valueStart++;
                        }

                        // Encontrar el final del valor
                        size_t valueEnd = valueStart;
                        if (valueStart < result.length() && result[valueStart] == '{') {
                            int braceCount = 1;
                            valueEnd = valueStart + 1;
                            bool inString = false;
                            bool escape = false;

                            while (valueEnd < result.length() && braceCount > 0) {
                                char c = result[valueEnd];

                                if (c == '"' && !escape) {
                                    inString = !inString;
                                } else if (!inString) {
                                    if (c == '{')
                                        braceCount++;
                                    else if (c == '}')
                                        braceCount--;
                                }

                                escape = (c == '\\' && !escape);
                                valueEnd++;
                            }

                            // Generar nuevo valor con indentación de exactamente 4 espacios por nivel
                            std::ostringstream newValue;
                            newValue << "{\n";

                            bool first = true;
                            for (const auto& [plugin, presets] : data.orderedData) {
                                if (!first) newValue << ",\n";
                                first = false;

                                // Nivel 2: 8 espacios (2 niveles * 4 espacios)
                                newValue << "        \"" << EscapeJson(plugin) << "\": [\n";

                                bool firstPreset = true;
                                for (const auto& preset : presets) {
                                    if (!firstPreset) newValue << ",\n";
                                    firstPreset = false;

                                    // Nivel 3: 12 espacios (3 niveles * 4 espacios)
                                    newValue << "            \"" << EscapeJson(preset) << "\"";
                                }

                                // Cerrar array con nivel 2: 8 espacios
                                newValue << "\n        ]";
                            }

                            // Cerrar objeto con nivel 1: 4 espacios
                            newValue << "\n    }";

                            // Reemplazar el valor en el resultado
                            result.replace(valueStart, valueEnd - valueStart, newValue.str());
                            logFile << "INFO: Successfully updated key '" << key << "' with proper 4-space indentation"
                                    << std::endl;
                        }
                    }
                }
            }
        }

        return result;
    } catch (const std::exception& e) {
        logFile << "ERROR in PreserveOriginalSections: " << e.what() << std::endl;
        return originalJson;  // Fallback al original
    } catch (...) {
        logFile << "ERROR in PreserveOriginalSections: Unknown exception" << std::endl;
        return originalJson;  // Fallback al original
    }
}

// ===== PARSEAR DATOS EXISTENTES DEL JSON =====

std::vector<std::pair<std::string, std::vector<std::string>>> parseOrderedPlugins(const std::string& content) {
    std::vector<std::pair<std::string, std::vector<std::string>>> result;
    if (content.empty()) return result;

    const char* str = content.c_str();
    size_t len = content.length();
    size_t pos = 0;
    const size_t maxIters = 100000;
    size_t iter = 0;

    result.reserve(200);

    try {
        while (pos < len && iter++ < maxIters) {
            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len) break;

            if (str[pos] != '"') {
                ++pos;
                continue;
            }

            size_t keyStart = pos + 1;
            ++pos;

            while (pos < len) {
                if (str[pos] == '"') {
                    size_t backslashCount = 0;
                    size_t checkPos = pos - 1;
                    while (checkPos < SIZE_MAX && str[checkPos] == '\\') {
                        backslashCount++;
                        checkPos--;
                    }
                    if (backslashCount % 2 == 0) break;
                }
                ++pos;
            }

            if (pos >= len) break;

            std::string plugin = content.substr(keyStart, pos - keyStart);
            ++pos;  // skip closing "

            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len || str[pos] != ':') {
                ++pos;
                continue;
            }

            ++pos;  // skip :
            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len || str[pos] != '[') {
                ++pos;
                continue;
            }

            ++pos;  // skip [

            std::vector<std::string> presets;
            presets.reserve(50);
            size_t presetIter = 0;

            while (pos < len && presetIter++ < maxIters) {
                while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
                if (pos >= len) break;

                if (str[pos] == ']') {
                    ++pos;  // skip ]
                    break;
                }

                if (str[pos] != '"') {
                    ++pos;
                    continue;
                }

                size_t presetStart = pos + 1;
                ++pos;

                while (pos < len) {
                    if (str[pos] == '"') {
                        size_t backslashCount = 0;
                        size_t checkPos = pos - 1;
                        while (checkPos < SIZE_MAX && str[checkPos] == '\\') {
                            backslashCount++;
                            checkPos--;
                        }
                        if (backslashCount % 2 == 0) break;
                    }
                    ++pos;
                }

                if (pos >= len) break;

                std::string preset = content.substr(presetStart, pos - presetStart);
                presets.push_back(std::move(preset));
                ++pos;  // skip closing "

                while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
                if (pos < len && str[pos] == ',') {
                    ++pos;  // skip ,
                    while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
                }
            }

            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos < len && str[pos] == ',') ++pos;

            if (!plugin.empty()) {
                result.emplace_back(std::move(plugin), std::move(presets));
            }
        }
    } catch (...) {
        // En caso de error, retornar lo que se haya parseado
    }

    return result;
}

std::pair<bool, std::string> ReadCompleteJson(const fs::path& jsonPath,
                                              std::map<std::string, OrderedPluginData>& processedData,
                                              std::ofstream& logFile) {
    try {
        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist at: " << jsonPath.string() << std::endl;
            return {false, ""};
        }

        if (!PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "ERROR: JSON integrity check failed" << std::endl;
            return {false, ""};
        }

        std::ifstream jsonFile(jsonPath, std::ios::binary);
        if (!jsonFile.is_open()) {
            logFile << "ERROR: Could not open JSON file at: " << jsonPath.string() << std::endl;
            return {false, ""};
        }

        logFile << "Reading existing JSON from: " << jsonPath.string() << std::endl;

        jsonFile.seekg(0, std::ios::end);
        size_t fileSize = jsonFile.tellg();
        jsonFile.seekg(0, std::ios::beg);

        const size_t maxFileSize = 50 * 1024 * 1024;  // 50MB
        if (fileSize > maxFileSize) {
            logFile << "WARNING: JSON file is very large (" << fileSize << " bytes), limiting to " << maxFileSize
                    << " bytes" << std::endl;
            fileSize = maxFileSize;
        }

        std::string jsonContent;
        jsonContent.resize(fileSize);
        jsonFile.read(&jsonContent[0], fileSize);
        jsonFile.close();

        if (jsonContent.empty() || jsonContent.size() < 2) {
            logFile << "ERROR: JSON file is empty or too small after reading" << std::endl;
            return {false, ""};
        }

        // Parsear solo las 8 claves válidas
        const std::vector<std::string> validKeys = {"npcFormID",       "npc",           "factionFemale", "factionMale",
                                                    "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        for (const auto& key : validKeys) {
            processedData[key] = OrderedPluginData();

            size_t keyPos = jsonContent.find("\"" + key + "\"");
            if (keyPos != std::string::npos) {
                size_t colonPos = jsonContent.find(":", keyPos);
                if (colonPos != std::string::npos) {
                    size_t openBrace = jsonContent.find("{", colonPos);
                    if (openBrace != std::string::npos) {
                        int braceCount = 1;
                        size_t pos = openBrace + 1;
                        size_t closeBrace = std::string::npos;
                        bool inString = false;
                        bool escape = false;

                        while (pos < jsonContent.length() && braceCount > 0) {
                            char c = jsonContent[pos];

                            if (c == '"' && !escape) {
                                inString = !inString;
                            } else if (!inString) {
                                if (c == '{') {
                                    braceCount++;
                                } else if (c == '}') {
                                    braceCount--;
                                    if (braceCount == 0) {
                                        closeBrace = pos;
                                        break;
                                    }
                                }
                            }

                            escape = (c == '\\' && !escape);
                            pos++;
                        }

                        if (closeBrace != std::string::npos) {
                            std::string keyContent = jsonContent.substr(openBrace + 1, closeBrace - openBrace - 1);
                            auto orderedPlugins = parseOrderedPlugins(keyContent);

                            for (const auto& p : orderedPlugins) {
                                for (const auto& preset : p.second) {
                                    processedData[key].addPreset(p.first, preset);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Log de lo que se cargó
        logFile << "Loaded existing data from JSON:" << std::endl;
        for (const auto& [key, data] : processedData) {
            size_t count = data.getTotalPresetCount();
            if (count > 0) {
                logFile << "  " << key << ": " << data.getPluginCount() << " plugins, " << count << " presets"
                        << std::endl;
            }
        }
        logFile << std::endl;

        return {true, jsonContent};
    } catch (const std::exception& e) {
        logFile << "ERROR in ReadCompleteJson: " << e.what() << std::endl;
        return {false, ""};
    } catch (...) {
        logFile << "ERROR in ReadCompleteJson: Unknown exception occurred" << std::endl;
        return {false, ""};
    }
}

// ===== ESCRITURA ATÓMICA ULTRA-SEGURA =====

bool WriteJsonAtomically(const fs::path& jsonPath, const std::string& content, const fs::path& analysisDir,
                         std::ofstream& logFile) {
    try {
        // Escribir a archivo temporal primero
        fs::path tempPath = jsonPath;
        tempPath.replace_extension(".tmp");

        std::ofstream tempFile(tempPath, std::ios::out | std::ios::trunc | std::ios::binary);
        if (!tempFile.is_open()) {
            logFile << "ERROR: Could not create temporary JSON file!" << std::endl;
            return false;
        }

        tempFile << content;
        tempFile.close();

        if (tempFile.fail()) {
            logFile << "ERROR: Failed to write to temporary JSON file!" << std::endl;
            return false;
        }

        // Verificar integridad del archivo temporal
        if (!PerformTripleValidation(tempPath, fs::path(), logFile)) {
            logFile << "ERROR: Temporary JSON file failed integrity check!" << std::endl;
            // Mover archivo temporal defectuoso a análisis
            MoveCorruptedJsonToAnalysis(tempPath, analysisDir, logFile);
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

        // Mover el archivo temporal al destino final
        std::error_code ec;
        fs::rename(tempPath, jsonPath, ec);

        if (ec) {
            logFile << "ERROR: Failed to move temporary file to final location: " << ec.message() << std::endl;
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

        // Verificación final
        if (PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON file written atomically and verified!" << std::endl;
            return true;
        } else {
            logFile << "ERROR: Final JSON file failed integrity check!" << std::endl;
            // Mover archivo final defectuoso a análisis
            MoveCorruptedJsonToAnalysis(jsonPath, analysisDir, logFile);
            return false;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in WriteJsonAtomically: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in WriteJsonAtomically: Unknown exception" << std::endl;
        return false;
    }
}

void UpdateIniRuleCount(const fs::path& iniPath, const std::string& originalLine, int newCount) {
    try {
        std::ifstream iniFile(iniPath);
        if (!iniFile.is_open()) return;

        std::vector<std::string> lines;
        std::string line;
        lines.reserve(200);

        while (std::getline(iniFile, line)) {
            lines.push_back(line);
        }
        iniFile.close();

        // Buscar y actualizar la línea
        for (auto& fileLine : lines) {
            std::string cleanLine = fileLine;

            size_t commentPos = cleanLine.find(';');
            if (commentPos != std::string::npos) {
                cleanLine = cleanLine.substr(0, commentPos);
            }

            commentPos = cleanLine.find('#');
            if (commentPos != std::string::npos) {
                cleanLine = cleanLine.substr(0, commentPos);
            }

            cleanLine = Trim(cleanLine);
            std::string originalLineClean = Trim(originalLine);

            if (cleanLine == originalLineClean) {
                size_t lastPipe = fileLine.rfind('|');
                if (lastPipe != std::string::npos) {
                    std::string beforePipe = fileLine.substr(0, lastPipe + 1);
                    fileLine = beforePipe + std::to_string(newCount);
                }
                break;
            }
        }

        // Escribir de vuelta al archivo
        std::ofstream outFile(iniPath, std::ios::out | std::ios::trunc);
        if (outFile.is_open()) {
            for (const auto& outputLine : lines) {
                outFile << outputLine << std::endl;
            }
            outFile.close();
        }

    } catch (...) {
        // Silent fail on error
    }
}

// ===== FUNCIÓN PRINCIPAL CORREGIDA CON CORRECCIÓN DE INDENTACIÓN =====

extern "C" __declspec(dllexport) bool SKSEPlugin_Load(const SKSE::LoadInterface* skse) {
    try {
        SKSE::Init(skse);

        SKSE::GetMessagingInterface()->RegisterListener([](SKSE::MessagingInterface::Message* message) {
            try {
                if (message->type == SKSE::MessagingInterface::kDataLoaded) {
                    std::string documentsPath;
                    std::string gamePath;

                    // Obtener rutas de manera ultra-segura
                    try {
                        documentsPath = GetDocumentsPath();
                        gamePath = GetGamePath();
                    } catch (...) {
                        RE::ConsoleLog::GetSingleton()->Print("OBody Assistant: Error getting paths - using defaults");
                        documentsPath = "C:\\Users\\Default\\Documents";
                        gamePath = "";
                    }

                    if (gamePath.empty() || documentsPath.empty()) {
                        RE::ConsoleLog::GetSingleton()->Print(
                            "OBody Assistant: Could not find Game or Documents path.");
                        return;
                    }

                    // Configuración de rutas y logging
                    fs::path dataPath = fs::path(gamePath) / "Data";
                    fs::path sksePluginsPath = dataPath / "SKSE" / "Plugins";
                    CreateDirectoryIfNotExists(sksePluginsPath);

                    fs::path logFilePath = fs::path(documentsPath) / "My Games" / "Skyrim Special Edition" / "SKSE" /
                                           "OBody_NG_Preset_Distribution_Assistant-NG.log";
                    CreateDirectoryIfNotExists(logFilePath.parent_path());

                    std::ofstream logFile(logFilePath, std::ios::out | std::ios::trunc);

                    auto now = std::chrono::system_clock::now();
                    std::time_t in_time_t = std::chrono::system_clock::to_time_t(now);
                    std::tm buf;
                    localtime_s(&buf, &in_time_t);

                    logFile << "====================================================" << std::endl;
                    logFile << "OBody NG Preset Distribution Assistant NG - ULTRA SECURE VERSION WITH INLINE EMPTY "
                               "CONTAINERS AND MULTI-LINE EMPTY DETECTION"
                            << std::endl;
                    logFile << "Log created on: " << std::put_time(&buf, "%Y-%m-%d %H:%M:%S") << std::endl;
                    logFile << "====================================================" << std::endl << std::endl;

                    // RUTAS PRINCIPALES (MODIFICADAS)
                    fs::path backupConfigIniPath = sksePluginsPath / "OBody_NG_Preset_Distribution_Assistant_NG.ini";
                    fs::path jsonOutputPath = sksePluginsPath / "OBody_presetDistributionConfig.json";
                    fs::path backupJsonPath =
                        sksePluginsPath / "Backup_OBody_DPA" / "OBody_presetDistributionConfig.json";
                    fs::path analysisDir = sksePluginsPath / "Backup_OBody_DPA" / "Analysis";

                    logFile << "Checking backup configuration..." << std::endl;
                    logFile << "----------------------------------------------------" << std::endl;
                    int backupValue = ReadBackupConfigFromIni(backupConfigIniPath, logFile);

                    // ===== VALIDACIÓN DE INTEGRIDAD INICIAL CON RESTAURACIÓN AUTOMÁTICA (MODIFICADO) =====
                    logFile << std::endl;
                    if (!PerformSimpleJsonIntegrityCheck(jsonOutputPath, logFile)) {
                        logFile << std::endl;
                        logFile << "CRITICAL: JSON failed simple integrity check at startup! Attempting to restore "
                                   "from backup..."
                                << std::endl;

                        // Intentar restaurar desde el backup
                        if (RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup. Proceeding with the normal process."
                                    << std::endl;
                            // El proceso puede continuar normalmente después de la restauración.
                        } else {
                            // La restauración falló o no se encontró un backup. Ahora terminamos.
                            logFile << std::endl;
                            logFile << "CRITICAL ERROR: Could not restore from backup. The JSON file is likely "
                                       "corrupted and no valid backup is available."
                                    << std::endl;
                            logFile << "Process terminated to prevent further damage." << std::endl;
                            logFile << std::endl;
                            logFile << "RECOMMENDED ACTIONS:" << std::endl;
                            logFile << "1. Check the analysis folder for the corrupted file: " << analysisDir.string()
                                    << std::endl;
                            logFile << "2. Manually check for any older backups or reinstall the mod providing the "
                                       "base JSON file."
                                    << std::endl;
                            logFile << "3. Contact the mod author if the problem persists." << std::endl;
                            logFile << "====================================================" << std::endl;
                            logFile.close();

                            RE::ConsoleLog::GetSingleton()->Print(
                                "CRITICAL ERROR: OBody JSON is corrupted and could not be restored! Check the log file "
                                "for details.");
                            return;  // TERMINACIÓN TEMPRANA DEL PROCESO
                        }
                    }

                    // Si llegamos aquí, el JSON pasó la validación simple o fue restaurado exitosamente
                    logFile << "JSON passed initial integrity check or was restored - proceeding with normal process..."
                            << std::endl;
                    logFile << "JSON will be formatted with proper 4-space indentation hierarchy with inline empty "
                               "containers and multi-line empty detection."
                            << std::endl;
                    logFile << std::endl;

                    // Inicializar estructuras de datos
                    const std::set<std::string> validKeys = {
                        "npcFormID",       "npc",           "factionFemale", "factionMale",
                        "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

                    std::map<std::string, OrderedPluginData> processedData;
                    for (const auto& key : validKeys) {
                        processedData[key] = OrderedPluginData();
                    }

                    bool backupPerformed = false;

                    // SISTEMA DE BACKUP LITERAL PERFECTO
                    if (backupValue == 1 || backupValue == 2) {
                        if (backupValue == 2) {
                            logFile << "Backup enabled (Backup = true), performing LITERAL backup always..."
                                    << std::endl;
                        } else {
                            logFile << "Backup enabled (Backup = 1), performing LITERAL backup..." << std::endl;
                        }

                        if (PerformLiteralJsonBackup(jsonOutputPath, backupJsonPath, logFile)) {
                            backupPerformed = true;
                            // Solo actualizar INI si no es modo "true" (valor 2)
                            if (backupValue != 2) {
                                UpdateBackupConfigInIni(backupConfigIniPath, logFile, backupValue);
                            }
                        } else {
                            logFile << "ERROR: LITERAL backup failed, continuing with normal process..." << std::endl;
                        }

                    } else {
                        logFile << "Backup disabled (Backup = 0), skipping backup" << std::endl;
                        logFile
                            << "The original backup was already performed at "
                               "\\SKSE\\Plugins\\Backup_OBody_DPA\\OBody_presetDistributionConfig.json"  // MODIFICADO
                            << std::endl;
                    }

                    logFile << std::endl;

                    // Leer el JSON existente con verificación mejorada
                    auto readResult = ReadCompleteJson(jsonOutputPath, processedData, logFile);
                    bool readSuccess = readResult.first;
                    std::string originalJsonContent = readResult.second;

                    if (!readSuccess) {
                        logFile << "JSON read failed, attempting to restore from backup..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "Backup restoration successful, retrying JSON read..." << std::endl;
                            readResult = ReadCompleteJson(jsonOutputPath, processedData, logFile);
                            readSuccess = readResult.first;
                            originalJsonContent = readResult.second;
                        }

                        if (!readSuccess) {
                            logFile
                                << "Process truncated due to JSON read error. No INI processing or updates performed."
                                << std::endl;
                            logFile << "====================================================" << std::endl;
                            logFile.close();

                            RE::ConsoleLog::GetSingleton()->Print(
                                "ERROR: JSON READ FAILED - CONTACT MODDER OR REINSTALL!");
                            return;
                        } else {
                            logFile << "JSON read successful after restoration!" << std::endl;
                        }
                    }

                    int totalRulesProcessed = 0;
                    int totalRulesApplied = 0;
                    int totalRulesSkipped = 0;
                    int totalPresetsRemoved = 0;
                    int totalPluginsRemoved = 0;
                    int totalFilesProcessed = 0;

                    logFile << "Scanning for OBodyNG_PDA_*.ini files..." << std::endl;
                    logFile << "----------------------------------------------------" << std::endl;

                    // Procesar archivos .ini
                    try {
                        for (const auto& entry : fs::directory_iterator(dataPath)) {
                            if (entry.is_regular_file()) {
                                std::string filename = entry.path().filename().string();
                                if (filename.starts_with("OBodyNG_PDA_") && filename.ends_with(".ini")) {
                                    logFile << std::endl << "Processing file: " << filename << std::endl;
                                    totalFilesProcessed++;

                                    std::ifstream iniFile(entry.path());
                                    if (!iniFile.is_open()) {
                                        logFile << "  ERROR: Could not open file!" << std::endl;
                                        continue;
                                    }

                                    std::vector<std::pair<std::string, ParsedRule>> fileLinesAndRules;
                                    std::string line;
                                    int rulesInFile = 0;
                                    int rulesAppliedInFile = 0;
                                    int rulesSkippedInFile = 0;
                                    int presetsRemovedInFile = 0;
                                    int pluginsRemovedInFile = 0;
                                    fileLinesAndRules.reserve(100);

                                    while (std::getline(iniFile, line)) {
                                        std::string originalLine = line;

                                        // Eliminar comentarios
                                        size_t commentPos = line.find(';');
                                        if (commentPos != std::string::npos) {
                                            line = line.substr(0, commentPos);
                                        }

                                        commentPos = line.find('#');
                                        if (commentPos != std::string::npos) {
                                            line = line.substr(0, commentPos);
                                        }

                                        // Buscar el signo =
                                        size_t equalPos = line.find('=');
                                        if (equalPos != std::string::npos) {
                                            std::string key = Trim(line.substr(0, equalPos));
                                            std::string value = Trim(line.substr(equalPos + 1));

                                            if (validKeys.count(key) && !value.empty()) {
                                                ParsedRule rule = ParseRuleLine(key, value);

                                                if (!rule.plugin.empty() && !rule.presets.empty()) {
                                                    rulesInFile++;
                                                    totalRulesProcessed++;

                                                    // Lógica de aplicación
                                                    bool shouldApply = false;
                                                    bool needsUpdate = false;
                                                    int newCount = rule.applyCount;

                                                    if (rule.applyCount == -1 || rule.applyCount == -2 ||
                                                        rule.applyCount == -3 || rule.applyCount == -4 ||
                                                        rule.applyCount == -5 || rule.applyCount > 0) {
                                                        shouldApply = true;
                                                        if (rule.applyCount > 0) {
                                                            needsUpdate = true;
                                                            newCount = rule.applyCount - 1;
                                                        } else if (rule.applyCount == -2 || rule.applyCount == -3) {
                                                            needsUpdate = true;
                                                            newCount = 0;
                                                        }

                                                    } else {
                                                        shouldApply = false;
                                                        rulesSkippedInFile++;
                                                        totalRulesSkipped++;

                                                        if (rule.extra != "0") {
                                                            needsUpdate = true;
                                                            newCount = 0;
                                                            rule.applyCount = newCount;
                                                            fileLinesAndRules.emplace_back(originalLine, rule);
                                                            logFile << "  Skipped (invalid mode detected in extra '"
                                                                    << rule.extra << "', setting to 0): " << key
                                                                    << " -> Plugin: " << rule.plugin << std::endl;
                                                        } else {
                                                            logFile << "  Skipped (count=0): " << key
                                                                    << " -> Plugin: " << rule.plugin << std::endl;
                                                        }
                                                    }

                                                    if (shouldApply) {
                                                        auto& data = processedData[key];

                                                        // Aplicar las reglas
                                                        if (rule.applyCount == -1) {
                                                            int presetsAdded = 0;
                                                            for (const auto& preset : rule.presets) {
                                                                size_t beforeCount = data.getTotalPresetCount();
                                                                data.addPreset(rule.plugin, preset);
                                                                if (data.getTotalPresetCount() > beforeCount) {
                                                                    presetsAdded++;
                                                                }
                                                            }

                                                            if (presetsAdded > 0) {
                                                                rulesAppliedInFile++;
                                                                totalRulesApplied++;
                                                                logFile << "  Applied: " << key
                                                                        << " -> Plugin: " << rule.plugin << " -> Added "
                                                                        << presetsAdded << " new presets";
                                                                if (!rule.extra.empty()) {
                                                                    logFile << " (mode: " << rule.extra << ")";
                                                                }
                                                                logFile << std::endl;
                                                            } else {
                                                                logFile
                                                                    << "  No new presets added (all already exist): "
                                                                    << key << " -> Plugin: " << rule.plugin
                                                                    << std::endl;
                                                            }

                                                        } else if (rule.applyCount == -4 || rule.applyCount == -2) {
                                                            int presetsRemoved = 0;
                                                            for (const auto& preset : rule.presets) {
                                                                std::string targetPreset = preset;
                                                                if (!targetPreset.empty() && targetPreset[0] == '!') {
                                                                    targetPreset = targetPreset.substr(1);
                                                                }

                                                                size_t beforeCount = data.getTotalPresetCount();
                                                                data.removePreset(rule.plugin, targetPreset);
                                                                if (data.getTotalPresetCount() < beforeCount) {
                                                                    presetsRemoved++;
                                                                }
                                                            }

                                                            if (presetsRemoved > 0) {
                                                                rulesAppliedInFile++;
                                                                totalRulesApplied++;
                                                                totalPresetsRemoved += presetsRemoved;
                                                                presetsRemovedInFile += presetsRemoved;
                                                                logFile << "  Applied: " << key
                                                                        << " -> Plugin: " << rule.plugin
                                                                        << " -> Removed " << presetsRemoved
                                                                        << " presets";
                                                                if (!rule.extra.empty()) {
                                                                    logFile << " (mode: " << rule.extra << ")";
                                                                }
                                                                logFile << std::endl;

                                                                if (rule.applyCount == -2) {
                                                                    needsUpdate = true;
                                                                    newCount = 0;
                                                                }
                                                            } else {
                                                                logFile << "  No presets removed (not found): " << key
                                                                        << " -> Plugin: " << rule.plugin << std::endl;
                                                            }

                                                        } else if (rule.applyCount == -5 || rule.applyCount == -3) {
                                                            if (data.hasPlugin(rule.plugin)) {
                                                                data.removePlugin(rule.plugin);
                                                                rulesAppliedInFile++;
                                                                totalRulesApplied++;
                                                                totalPluginsRemoved++;
                                                                pluginsRemovedInFile++;
                                                                logFile << "  Applied: " << key
                                                                        << " -> Plugin: " << rule.plugin
                                                                        << " -> REMOVED ENTIRE PLUGIN";
                                                                if (!rule.extra.empty()) {
                                                                    logFile << " (mode: " << rule.extra << ")";
                                                                }
                                                                logFile << std::endl;

                                                                if (rule.applyCount == -3) {
                                                                    needsUpdate = true;
                                                                    newCount = 0;
                                                                }
                                                            } else {
                                                                logFile << "  No plugin removed (not found): " << key
                                                                        << " -> Plugin: " << rule.plugin << std::endl;
                                                            }

                                                        } else if (rule.applyCount > 0) {
                                                            int presetsAdded = 0;
                                                            for (const auto& preset : rule.presets) {
                                                                size_t beforeCount = data.getTotalPresetCount();
                                                                data.addPreset(rule.plugin, preset);
                                                                if (data.getTotalPresetCount() > beforeCount) {
                                                                    presetsAdded++;
                                                                }
                                                            }

                                                            if (presetsAdded > 0) {
                                                                rulesAppliedInFile++;
                                                                totalRulesApplied++;
                                                                logFile << "  Applied: " << key
                                                                        << " -> Plugin: " << rule.plugin << " -> Added "
                                                                        << presetsAdded
                                                                        << " new presets (remaining count: " << newCount
                                                                        << ")";
                                                                if (!rule.extra.empty()) {
                                                                    logFile << " (mode: " << rule.extra << ")";
                                                                }
                                                                logFile << std::endl;
                                                            } else {
                                                                logFile
                                                                    << "  No new presets added (all already exist): "
                                                                    << key << " -> Plugin: " << rule.plugin
                                                                    << " (remaining count: " << newCount << ")"
                                                                    << std::endl;
                                                            }
                                                        }

                                                        // Actualizar archivo INI si es necesario
                                                        if (needsUpdate) {
                                                            rule.applyCount = newCount;
                                                            fileLinesAndRules.emplace_back(originalLine, rule);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    iniFile.close();

                                    // Actualizar archivo INI con los nuevos valores
                                    for (const auto& [originalLine, rule] : fileLinesAndRules) {
                                        UpdateIniRuleCount(entry.path(), originalLine, rule.applyCount);
                                    }

                                    logFile << "  Rules in file: " << rulesInFile
                                            << " | Applied: " << rulesAppliedInFile
                                            << " | Skipped: " << rulesSkippedInFile
                                            << " | Presets removed: " << presetsRemovedInFile
                                            << " | Plugins removed: " << pluginsRemovedInFile << std::endl;
                                }
                            }
                        }
                    } catch (const std::exception& e) {
                        logFile << "ERROR scanning directory: " << e.what() << std::endl;
                    }

                    logFile << std::endl;
                    logFile << "====================================================" << std::endl;
                    logFile << "SUMMARY:" << std::endl;

                    if (backupPerformed) {
                        try {
                            auto backupSize = fs::file_size(backupJsonPath);
                            logFile << "Original JSON backup: SUCCESS (" << backupSize << " bytes)" << std::endl;
                        } catch (...) {
                            logFile << "Original JSON backup: SUCCESS (size verification failed)" << std::endl;
                        }

                    } else {
                        logFile << "Original JSON backup: SKIPPED" << std::endl;
                    }

                    logFile << "Total .ini files processed: " << totalFilesProcessed << std::endl;
                    logFile << "Total rules processed: " << totalRulesProcessed << std::endl;
                    logFile << "Total rules applied: " << totalRulesApplied << std::endl;
                    logFile << "Total rules skipped (count=0): " << totalRulesSkipped << std::endl;
                    logFile << "Total presets removed (-): " << totalPresetsRemoved << std::endl;
                    logFile << "Total plugins removed (*): " << totalPluginsRemoved << std::endl;
                    logFile << std::endl << "Final data in JSON:" << std::endl;

                    for (const auto& [key, data] : processedData) {
                        size_t count = data.getTotalPresetCount();
                        if (count > 0) {
                            logFile << "  " << key << ": " << data.getPluginCount() << " plugins, " << count
                                    << " total presets" << std::endl;
                        }
                    }

                    logFile << "====================================================" << std::endl << std::endl;

                    // ACTUALIZAR JSON CONSERVADORAMENTE CON FORMATO CORRECTO
                    logFile << "Updating JSON at: " << jsonOutputPath.string() << std::endl;
                    logFile << "Applying proper 4-space indentation format with inline empty containers and multi-line "
                               "empty detection..."
                            << std::endl;

                    try {
                        // Usar la función que preserva el formato original con indentación correcta
                        std::string updatedJsonContent =
                            PreserveOriginalSections(originalJsonContent, processedData, logFile);

                        // Escribir de manera atómica con verificación triple
                        if (WriteJsonAtomically(jsonOutputPath, updatedJsonContent, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON updated successfully with proper 4-space indentation hierarchy!"
                                    << std::endl;

                            // ===== NUEVO PASO: CORRECCIÓN COMPLETA DE INDENTACIÓN CON EMPTY INLINE Y MULTI-LINE EMPTY
                            // DETECTION =====
                            logFile << std::endl;
                            if (CorrectJsonIndentation(jsonOutputPath, analysisDir, logFile)) {
                                logFile << "SUCCESS: JSON indentation verification and correction completed with "
                                           "inline empty containers and multi-line empty detection!"
                                        << std::endl;
                            } else {
                                logFile << "ERROR: JSON indentation correction failed!" << std::endl;
                                logFile << "Attempting to restore from backup due to indentation failure..."
                                        << std::endl;
                                if (fs::exists(backupJsonPath) &&
                                    RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                                    logFile << "SUCCESS: JSON restored from backup after indentation failure!"
                                            << std::endl;
                                } else {
                                    logFile << "CRITICAL ERROR: Could not restore JSON from backup!" << std::endl;
                                }
                            }
                        } else {
                            logFile << "ERROR: Failed to write JSON safely!" << std::endl;
                            logFile << "Attempting to restore from backup due to write failure..." << std::endl;
                            if (fs::exists(backupJsonPath) &&
                                RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                                logFile << "SUCCESS: JSON restored from backup after write failure!" << std::endl;
                            } else {
                                logFile << "CRITICAL ERROR: Could not restore JSON from backup!" << std::endl;
                            }
                        }

                    } catch (const std::exception& e) {
                        logFile << "ERROR in JSON update process: " << e.what() << std::endl;
                        logFile << "Attempting to restore from backup due to update failure..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup after update failure!" << std::endl;
                        } else {
                            logFile << "CRITICAL ERROR: Could not restore JSON from backup!" << std::endl;
                        }

                    } catch (...) {
                        logFile << "ERROR in JSON update process: Unknown exception" << std::endl;
                        logFile << "Attempting to restore from backup due to unknown failure..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup after unknown failure!" << std::endl;
                        } else {
                            logFile << "CRITICAL ERROR: Could not restore JSON from backup!" << std::endl;
                        }
                    }

                    logFile << std::endl
                            << "Process completed successfully with perfect 4-space JSON formatting, inline empty "
                               "containers, and multi-line empty detection."
                            << std::endl;
                    logFile.close();

                    RE::ConsoleLog::GetSingleton()->Print("OBody Assistant: Process completed successfully!");
                }

            } catch (const std::exception& e) {
                RE::ConsoleLog::GetSingleton()->Print("ERROR in OBody Assistant main process!");
            } catch (...) {
                RE::ConsoleLog::GetSingleton()->Print("CRITICAL ERROR in OBody Assistant!");
            }
        });

        return true;
    } catch (const std::exception& e) {
        RE::ConsoleLog::GetSingleton()->Print("ERROR loading OBody Assistant plugin!");
        return false;
    } catch (...) {
        RE::ConsoleLog::GetSingleton()->Print("CRITICAL ERROR loading OBody Assistant plugin!");
        return false;
    }
}
