#include <RE/Skyrim.h>
#include <REL/Relocation.h>
#include <SKSE/SKSE.h>
#include <shlobj.h>
#include <windows.h>
#include <knownfolders.h>

#include <algorithm>
#include <chrono>
#include <ctime>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <random>
#include <set>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

namespace fs = std::filesystem;

// ===== VERSION =====
static constexpr const char* PLUGIN_VERSION = "2.2.5";

// ===== UBE RACES CONSTANT =====
const std::vector<std::string> UBE_RACES = {
    // Base races (11)
    "00UBE_HighElfRace",
    "00UBE_BretonRace",
    "00UBE_ImperialRace",
    "00UBE_RedguardRace",
    "00UBE_DarkElfRace",
    "00UBE_WoodElfRace",
    "00UBE_NordRace",
    "00UBE_OrcRace",
    "00UBE_ElderRace",
    "00UBE_KhajiitRace",
    "00UBE_ArgonianRace",
    
    // Vampire races (11)
    "00UBE_OrcRaceVampire",
    "00UBE_HighElfRaceVampire",
    "00UBE_BretonRaceVampire",
    "00UBE_ImperialRaceVampire",
    "00UBE_RedguardRaceVampire",
    "00UBE_DarkElfRaceVampire",
    "00UBE_WoodElfRaceVampire",
    "00UBE_NordRaceVampire",
    "00UBE_ElderRaceVampire",
    "00UBE_KhajiitRaceVampire",
    "00UBE_ArgonianRaceVampire"
};

// ===== EXCLUDED PRESETS FROM UBE RACES (BUT ALLOWED IN BLACKLIST) =====
const std::vector<std::string> EXCLUDED_FROM_UBE_RACES = {
    "- Zeroed Sliders -",
    "-Zeroed Sliders-",
    "Zeroed Sliders",
    "HIMBO Zero for OBody"
};

// ===== PROTECTED PRESETS FROM SMART CLEANING =====
const std::vector<std::string> PROTECTED_FROM_CLEANING = {
    "- Zeroed Sliders -",
    "-Zeroed Sliders-",
    "Zeroed Sliders",
    "HIMBO Zero for OBody",
    "LS Force Naked",
    "OBody Nude 32",
    "ElderRace"
};

// ===== C++17 COMPATIBLE STRING FUNCTIONS =====
bool EndsWith(const std::string& str, const std::string& suffix) {
    if (suffix.size() > str.size()) return false;
    return str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
}

bool StartsWith(const std::string& str, const std::string& prefix) {
    if (prefix.size() > str.size()) return false;
    return str.compare(0, prefix.size(), prefix) == 0;
}

// ===== IMPROVED MULTIIDIOMA SUPPORT FUNCTIONS =====

std::string SafeWideStringToString(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    
    try {
        // ATTEMPT 1: UTF-8 (preferred for all languages)
        int size_needed = WideCharToMultiByte(
            CP_UTF8,
            0,
            wstr.c_str(),
            static_cast<int>(wstr.size()),
            nullptr,
            0,
            nullptr,
            nullptr
        );
        
        if (size_needed > 0) {
            std::string result(size_needed, 0);
            int converted = WideCharToMultiByte(
                CP_UTF8,
                0,
                wstr.c_str(),
                static_cast<int>(wstr.size()),
                &result[0],
                size_needed,
                nullptr,
                nullptr
            );
            
            if (converted > 0) {
                return result;
            }
        }
        
        // ATTEMPT 2: CP_ACP (Active Code Page)
        size_needed = WideCharToMultiByte(
            CP_ACP,
            0,
            wstr.c_str(),
            static_cast<int>(wstr.size()),
            nullptr,
            0,
            nullptr,
            nullptr
        );
        
        if (size_needed > 0) {
            std::string result(size_needed, 0);
            int converted = WideCharToMultiByte(
                CP_ACP,
                0,
                wstr.c_str(),
                static_cast<int>(wstr.size()),
                &result[0],
                size_needed,
                nullptr,
                nullptr
            );
            
            if (converted > 0) {
                return result;
            }
        }
        
        // FINAL FALLBACK: Safe ASCII conversion
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

std::string GetDocumentsPath() {
    try {
        // METHOD 1: SHGetKnownFolderPath (Windows Vista+, modern)
        wchar_t* path = nullptr;
        HRESULT hr = SHGetKnownFolderPath(
            FOLDERID_Documents,
            0,
            nullptr,
            &path
        );
        
        if (SUCCEEDED(hr) && path != nullptr) {
            std::wstring ws(path);
            CoTaskMemFree(path);
            std::string converted = SafeWideStringToString(ws);
            if (!converted.empty()) {
                return converted;
            }
        }
        
        // METHOD 2: SHGetFolderPathW (Windows XP+, compatibility)
        wchar_t pathBuffer[MAX_PATH] = {0};
        HRESULT result = SHGetFolderPathW(
            nullptr,
            CSIDL_PERSONAL,
            nullptr,
            SHGFP_TYPE_CURRENT,
            pathBuffer
        );
        
        if (SUCCEEDED(result)) {
            std::wstring ws(pathBuffer);
            std::string converted = SafeWideStringToString(ws);
            if (!converted.empty()) {
                return converted;
            }
        }
        
        // METHOD 3: USERPROFILE environment variable
        std::string userProfile = GetEnvVar("USERPROFILE");
        if (!userProfile.empty()) {
            return userProfile + "\\Documents";
        }
        
        // METHOD 4: HOMEDRIVE + HOMEPATH environment variables
        std::string homeDrive = GetEnvVar("HOMEDRIVE");
        std::string homePath = GetEnvVar("HOMEPATH");
        if (!homeDrive.empty() && !homePath.empty()) {
            return homeDrive + homePath + "\\Documents";
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
    }
}

std::string ReadFileWithEncoding(const fs::path& filepath) {
    try {
        std::ifstream file(filepath, std::ios::binary);
        if (!file.is_open()) {
            return "";
        }

        std::string content((std::istreambuf_iterator<char>(file)),
                           std::istreambuf_iterator<char>());
        file.close();

        if (content.size() >= 3 &&
            static_cast<unsigned char>(content[0]) == 0xEF &&
            static_cast<unsigned char>(content[1]) == 0xBB &&
            static_cast<unsigned char>(content[2]) == 0xBF) {
            content = content.substr(3);
        }

        std::string cleaned;
        cleaned.reserve(content.size());
        
        for (size_t i = 0; i < content.size(); ++i) {
            unsigned char c = static_cast<unsigned char>(content[i]);
            
            if (c < 128) {
                cleaned += c;
            }
            else {
                if ((c & 0xE0) == 0xC0 && i + 1 < content.size()) {
                    unsigned char c2 = static_cast<unsigned char>(content[i + 1]);
                    if ((c2 & 0xC0) == 0x80) {
                        int codepoint = ((c & 0x1F) << 6) | (c2 & 0x3F);
                        if (codepoint == 0x2018 || codepoint == 0x2019) {
                            cleaned += '\'';
                            i += 1;
                            continue;
                        }
                    }
                }
                else if ((c & 0xF0) == 0xE0 && i + 2 < content.size()) {
                    unsigned char c2 = static_cast<unsigned char>(content[i + 1]);
                    unsigned char c3 = static_cast<unsigned char>(content[i + 2]);
                    if ((c2 & 0xC0) == 0x80 && (c3 & 0xC0) == 0x80) {
                        int codepoint = ((c & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F);
                        
                        if (codepoint == 0x2018 || codepoint == 0x2019) {
                            cleaned += '\'';
                            i += 2;
                            continue;
                        }
                        else if (codepoint == 0x201C || codepoint == 0x201D) {
                            cleaned += '"';
                            i += 2;
                            continue;
                        }
                        else if (codepoint == 0x2014) {
                            cleaned += '-';
                            i += 2;
                            continue;
                        }
                    }
                }
                
                cleaned += c;
            }
        }

        return cleaned;

    } catch (const std::exception& e) {
        return "";
    } catch (...) {
        return "";
    }
}

// ===== UTILITY FUNCTIONS =====

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

std::string ToLowerCase(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(), 
                   [](unsigned char c) { return std::tolower(c); });
    return result;
}

std::string StripLeadingTrailingSymbols(const std::string& str) {
    if (str.empty()) return str;
    
    size_t start = 0;
    size_t end = str.length();
    
    if (!str.empty() && !std::isalnum(static_cast<unsigned char>(str[0])) && str[0] != ' ') {
        start = 1;
    }
    
    if (end > start && !std::isalnum(static_cast<unsigned char>(str[end - 1])) && str[end - 1] != ' ') {
        end--;
    }
    
    if (start >= end) return str;
    
    return str.substr(start, end - start);
}

std::string NormalizePresetName(const std::string& name) {
    std::string normalized;
    normalized.reserve(name.length());
    
    for (char c : name) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            normalized += std::tolower(static_cast<unsigned char>(c));
        }
    }
    
    return normalized;
}

std::string NormalizePresetNameFlexible(const std::string& name) {
    std::string normalized;
    normalized.reserve(name.length());
    
    for (char c : name) {
        if (std::isalnum(static_cast<unsigned char>(c))) {
            normalized += std::tolower(static_cast<unsigned char>(c));
        }
        else if (c == ' ') {
            normalized += ' ';
        }
        else if (c == '-') {
            normalized += ' ';
        }
    }
    
    std::string result;
    bool lastWasSpace = false;
    for (char c : normalized) {
        if (c == ' ') {
            if (!lastWasSpace) {
                result += c;
                lastWasSpace = true;
            }
        } else {
            result += c;
            lastWasSpace = false;
        }
    }
    
    size_t start = result.find_first_not_of(' ');
    size_t end = result.find_last_not_of(' ');
    if (start == std::string::npos) return "";
    return result.substr(start, end - start + 1);
}

std::string DecodeHtmlEntities(const std::string& str) {
    std::string result = str;
    size_t pos = 0;
    
    while ((pos = result.find("&amp;", pos)) != std::string::npos) {
        result.replace(pos, 5, "&");
        pos += 1;
    }
    
    pos = 0;
    while ((pos = result.find("&apos;", pos)) != std::string::npos) {
        result.replace(pos, 6, "'");
        pos += 1;
    }
    
    pos = 0;
    while ((pos = result.find("&quot;", pos)) != std::string::npos) {
        result.replace(pos, 6, "\"");
        pos += 1;
    }
    
    pos = 0;
    while ((pos = result.find("&lt;", pos)) != std::string::npos) {
        result.replace(pos, 4, "<");
        pos += 1;
    }
    
    pos = 0;
    while ((pos = result.find("&gt;", pos)) != std::string::npos) {
        result.replace(pos, 4, ">");
        pos += 1;
    }
    
    return result;
}

// ===== IMPROVED XML PRESET EXTRACTION =====

struct XmlPresetInfo {
    std::string internalName;
    std::string filename;
    bool extractionSuccessful;
};

XmlPresetInfo ExtractPresetInfoFromXml(const fs::path& xmlPath, std::ofstream& logFile) {
    XmlPresetInfo info;
    info.extractionSuccessful = false;
    
    try {
        info.filename = xmlPath.stem().string();
    } catch (...) {
        try {
            auto u8name = xmlPath.stem().u8string();
            info.filename = std::string(u8name.begin(), u8name.end());
        } catch (...) {
            info.filename = "unknown";
            logFile << "  [ERROR] Could not read filename from path" << std::endl;
            return info;
        }
    }
    
    try {
        if (!fs::exists(xmlPath)) {
            return info;
        }
        
        std::string content = ReadFileWithEncoding(xmlPath);
        if (content.empty()) {
            return info;
        }
        
        size_t presetPos = content.find("<Preset");
        if (presetPos == std::string::npos) {
            presetPos = content.find("<preset");
        }
        
        if (presetPos == std::string::npos) {
            return info;
        }
        
        size_t namePos = content.find("name=", presetPos);
        if (namePos == std::string::npos) {
            return info;
        }
        
        size_t quoteStart = namePos + 5;
        
        while (quoteStart < content.length() && 
               (content[quoteStart] == ' ' || content[quoteStart] == '\t')) {
            quoteStart++;
        }
        
        if (quoteStart >= content.length()) {
            return info;
        }
        
        char quoteChar = content[quoteStart];
        if (quoteChar != '"' && quoteChar != '\'') {
            return info;
        }
        
        size_t nameStart = quoteStart + 1;
        size_t nameEnd = content.find(quoteChar, nameStart);
        
        if (nameEnd == std::string::npos) {
            return info;
        }
        
        info.internalName = content.substr(nameStart, nameEnd - nameStart);
        
        info.internalName = DecodeHtmlEntities(info.internalName);

// === MODIFICACIÓN 1: Truncar nombres en ';' o ',' ===
size_t semicolonPos = info.internalName.find(';');
size_t commaPos = info.internalName.find(',');
size_t truncatePos = std::string::npos;

if (semicolonPos != std::string::npos && commaPos != std::string::npos) {
    truncatePos = std::min(semicolonPos, commaPos);
} else if (semicolonPos != std::string::npos) {
    truncatePos = semicolonPos;
} else if (commaPos != std::string::npos) {
    truncatePos = commaPos;
}

if (truncatePos != std::string::npos) {
    info.internalName = info.internalName.substr(0, truncatePos);
    info.internalName = Trim(info.internalName); // Remove trailing spaces
}

// === MODIFICACIÓN 2: Reemplazar 'CustomPreset' con filename ===
if (info.internalName == "CustomPreset") {
    info.internalName = info.filename;
    logFile << "INFO: Replaced generic 'CustomPreset' with filename: "
            << info.filename << std::endl;
}

        info.filename = DecodeHtmlEntities(info.filename);
        
        info.extractionSuccessful = true;
        return info;
        
    } catch (...) {
        return info;
    }
}

std::string ExtractPresetNameFromXml(const fs::path& xmlPath, std::ofstream& logFile) {
    XmlPresetInfo info = ExtractPresetInfoFromXml(xmlPath, logFile);
    
    if (info.extractionSuccessful && !info.internalName.empty()) {
        return info.internalName;
    }
    
    return info.filename;
}

struct ParsedRule {
    std::string key;
    std::string plugin;
    std::vector<std::string> presets;
    std::string extra;
    int applyCount = -1;
};

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

struct ConfigSettings {
    int backupValue = 1;
    bool modeUBE = true;
    bool presetsSmartCleaning = false;
    bool blacklistedPresetsSmartCleaningFromRandomDistribution = false;
    bool blacklistedPresetsSmartCleaningFromAll = false;
    bool outfitsForceReSmartCleaning = false;
};

ConfigSettings ReadConfigFromIni(const fs::path& iniPath, std::ofstream& logFile) {
    ConfigSettings settings;
    
    try {
        if (!fs::exists(iniPath)) {
            logFile << "Creating config INI at: " << iniPath.string() << std::endl;
            std::ofstream createIni(iniPath, std::ios::out | std::ios::trunc);
            if (createIni.is_open()) {
                createIni << "[Original backup]" << std::endl;
                createIni << "Backup = 1" << std::endl;
                createIni << std::endl;
                createIni << "[blacklistedPresetsShowInOBodyMenu]" << std::endl;
                createIni << "ModeUBE = true" << std::endl;
                createIni << std::endl;
                createIni << "[Presets_Smart_Cleaning]" << std::endl;
                createIni << "Smart_Cleaning = false" << std::endl;
                createIni << std::endl;
                createIni << "[blacklistedPresets_Smart_Cleaning_FromRandomDistribution]" << std::endl;
                createIni << "Smart_Cleaning = false" << std::endl;
                createIni << std::endl;
                createIni << "[blacklistedPresets_Smart_Cleaning_FromAll]" << std::endl;
                createIni << "Smart_Cleaning = false" << std::endl;
                createIni << std::endl;
                createIni << "[outfitsForceRe_Smart_Cleaning]" << std::endl;
                createIni << "Smart_Cleaning = false" << std::endl;
                createIni.close();
                logFile << "SUCCESS: Config INI created with default values" << std::endl;
                settings.backupValue = 1;
                settings.modeUBE = true;
                settings.presetsSmartCleaning = false;
                settings.blacklistedPresetsSmartCleaningFromRandomDistribution = false;
                settings.blacklistedPresetsSmartCleaningFromAll = false;
                settings.outfitsForceReSmartCleaning = false;
                return settings;
            } else {
                logFile << "ERROR: Could not create config INI file" << std::endl;
                return settings;
            }
        }

        std::string content = ReadFileWithEncoding(iniPath);
        if (content.empty()) {
            logFile << "ERROR: Could not read config INI file" << std::endl;
            return settings;
        }

        std::stringstream ss(content);
        std::string line;
        std::string currentSection;

        while (std::getline(ss, line)) {
            std::string trimmedLine = Trim(line);

            if (trimmedLine.empty() || trimmedLine[0] == ';' || trimmedLine[0] == '#') {
                continue;
            }

            if (trimmedLine[0] == '[' && trimmedLine.back() == ']') {
                currentSection = trimmedLine.substr(1, trimmedLine.length() - 2);
                continue;
            }

            size_t equalPos = trimmedLine.find('=');
            if (equalPos != std::string::npos) {
                std::string key = Trim(trimmedLine.substr(0, equalPos));
                std::string value = Trim(trimmedLine.substr(equalPos + 1));

                if (currentSection == "Original backup" && key == "Backup") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.backupValue = 2;
                        logFile << "Read config: Backup = true (always backup mode)" << std::endl;
                    } else {
                        try {
                            settings.backupValue = std::stoi(value);
                            logFile << "Read config: Backup = " << settings.backupValue << std::endl;
                        } catch (...) {
                            logFile << "Warning: Invalid Backup value, using default (1)" << std::endl;
                            settings.backupValue = 1;
                        }
                    }
                } else if (currentSection == "blacklistedPresetsShowInOBodyMenu" && key == "ModeUBE") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.modeUBE = true;
                        logFile << "Read config: ModeUBE = true" << std::endl;
                    } else if (value == "false" || value == "False" || value == "FALSE") {
                        settings.modeUBE = false;
                        logFile << "Read config: ModeUBE = false" << std::endl;
                    } else {
                        logFile << "Warning: Invalid ModeUBE value, using default (true)" << std::endl;
                        settings.modeUBE = true;
                    }
                } else if (currentSection == "Presets_Smart_Cleaning" && key == "Smart_Cleaning") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.presetsSmartCleaning = true;
                        logFile << "Read config: Presets_Smart_Cleaning = true" << std::endl;
                    } else if (value == "false" || value == "False" || value == "FALSE") {
                        settings.presetsSmartCleaning = false;
                        logFile << "Read config: Presets_Smart_Cleaning = false" << std::endl;
                    } else {
                        logFile << "Warning: Invalid Presets_Smart_Cleaning value, using default (false)" << std::endl;
                        settings.presetsSmartCleaning = false;
                    }
                } else if (currentSection == "blacklistedPresets_Smart_Cleaning_FromRandomDistribution" && key == "Smart_Cleaning") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.blacklistedPresetsSmartCleaningFromRandomDistribution = true;
                        logFile << "Read config: blacklistedPresets_Smart_Cleaning_FromRandomDistribution = true" << std::endl;
                    } else if (value == "false" || value == "False" || value == "FALSE") {
                        settings.blacklistedPresetsSmartCleaningFromRandomDistribution = false;
                        logFile << "Read config: blacklistedPresets_Smart_Cleaning_FromRandomDistribution = false" << std::endl;
                    } else {
                        logFile << "Warning: Invalid blacklistedPresets_Smart_Cleaning_FromRandomDistribution value, using default (false)" << std::endl;
                        settings.blacklistedPresetsSmartCleaningFromRandomDistribution = false;
                    }
                } else if (currentSection == "blacklistedPresets_Smart_Cleaning_FromAll" && key == "Smart_Cleaning") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.blacklistedPresetsSmartCleaningFromAll = true;
                        logFile << "Read config: blacklistedPresets_Smart_Cleaning_FromAll = true" << std::endl;
                    } else if (value == "false" || value == "False" || value == "FALSE") {
                        settings.blacklistedPresetsSmartCleaningFromAll = false;
                        logFile << "Read config: blacklistedPresets_Smart_Cleaning_FromAll = false" << std::endl;
                    } else {
                        logFile << "Warning: Invalid blacklistedPresets_Smart_Cleaning_FromAll value, using default (false)" << std::endl;
                        settings.blacklistedPresetsSmartCleaningFromAll = false;
                    }
                } else if (currentSection == "outfitsForceRe_Smart_Cleaning" && key == "Smart_Cleaning") {
                    if (value == "true" || value == "True" || value == "TRUE") {
                        settings.outfitsForceReSmartCleaning = true;
                        logFile << "Read config: outfitsForceRe_Smart_Cleaning = true" << std::endl;
                    } else if (value == "false" || value == "False" || value == "FALSE") {
                        settings.outfitsForceReSmartCleaning = false;
                        logFile << "Read config: outfitsForceRe_Smart_Cleaning = false" << std::endl;
                    } else {
                        logFile << "Warning: Invalid outfitsForceRe_Smart_Cleaning value, using default (false)" << std::endl;
                        settings.outfitsForceReSmartCleaning = false;
                    }
                }
            }
        }

        return settings;
        
    } catch (const std::exception& e) {
        logFile << "ERROR in ReadConfigFromIni: " << e.what() << std::endl;
        return settings;
    } catch (...) {
        logFile << "ERROR in ReadConfigFromIni: Unknown exception" << std::endl;
        return settings;
    }
}

void UpdateBackupConfigInIni(const fs::path& iniPath, std::ofstream& logFile, int originalValue) {
    try {
        if (!fs::exists(iniPath)) {
            logFile << "ERROR: Config INI file does not exist for update" << std::endl;
            return;
        }

        if (originalValue == 2) {
            logFile << "INFO: Backup = true detected, INI will not be updated (always backup mode)" << std::endl;
            return;
        }

        std::string content = ReadFileWithEncoding(iniPath);
        if (content.empty()) {
            logFile << "ERROR: Could not read config INI file for update" << std::endl;
            return;
        }

        std::stringstream ss(content);
        std::vector<std::string> lines;
        std::string line;
        std::string currentSection;
        bool backupValueUpdated = false;
        lines.reserve(100);

        while (std::getline(ss, line)) {
            std::string trimmedLine = Trim(line);

            if (trimmedLine[0] == '[' && trimmedLine.back() == ']') {
                currentSection = trimmedLine.substr(1, trimmedLine.length() - 2);
                lines.push_back(line);
                continue;
            }

            if (currentSection == "Original backup") {
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

        if (!backupValueUpdated) {
            logFile << "Warning: Backup value not found in INI during update" << std::endl;
            return;
        }

        std::ofstream outFile(iniPath, std::ios::out | std::ios::trunc);
        if (!outFile.is_open()) {
            logFile << "ERROR: Could not open config INI file for writing" << std::endl;
            return;
        }

        for (const auto& outputLine : lines) {
            outFile << outputLine << std::endl;
        }

        outFile.close();
        if (outFile.fail()) {
            logFile << "ERROR: Failed to write config INI file" << std::endl;
        } else {
            logFile << "SUCCESS: Config updated (Backup = 0)" << std::endl;
        }

    } catch (const std::exception& e) {
        logFile << "ERROR in UpdateBackupConfigInIni: " << e.what() << std::endl;
    } catch (...) {
        logFile << "ERROR in UpdateBackupConfigInIni: Unknown exception" << std::endl;
    }
}
// ===== SMART CLEANING FUNCTIONS WITH INTELLIGENT PRESET MATCHING =====

struct PresetMatchResult {
    bool found = false;
    std::string actualPresetName = "";
    int matchLevel = 0;
};

struct PresetMapData {
    std::map<std::string, std::string> exactMap;
    std::map<std::string, std::string> normalizedMap;
    std::map<std::string, std::string> filenameToInternalMap;
    std::set<std::string> allValidNames;
};

PresetMapData BuildPresetNameMap(const fs::path& bodySlidePresetsPath, std::ofstream& logFile) {
    PresetMapData presetData;
    
    try {
        if (!fs::exists(bodySlidePresetsPath)) {
            logFile << "WARNING: BodySlide presets folder not found for building preset map" << std::endl;
            return presetData;
        }
        
        int totalXmlFiles = 0;
        int successfulExtractions = 0;
        int usingFilenameAsFallback = 0;
        int filenameFailed = 0;
        
        for (const auto& entry : fs::directory_iterator(bodySlidePresetsPath)) {
            try {
                if (entry.is_regular_file()) {
                    std::string filename;
                    try {
                        auto u8name = entry.path().filename().u8string();
                        filename = std::string(u8name.begin(), u8name.end());
                    } catch (...) {
                        try {
                            filename = entry.path().filename().string();
                        } catch (...) {
                            filenameFailed++;
                            logFile << "  [ERROR] Could not read filename for entry" << std::endl;
                            continue;
                        }
                    }
                    
                    if (EndsWith(filename, ".xml")) {
                        totalXmlFiles++;
                        
                        try {
                            XmlPresetInfo info = ExtractPresetInfoFromXml(entry.path(), logFile);
                            
                            std::string presetNameToUse;
                            
                            if (info.extractionSuccessful && !info.internalName.empty()) {
                                presetNameToUse = info.internalName;
                                successfulExtractions++;
                                
                                presetData.filenameToInternalMap[info.filename] = info.internalName;
                                
                                if (info.filename != info.internalName) {
                                    logFile << "  [MAPPING] File: " << info.filename 
                                            << " -> Internal: " << info.internalName << std::endl;
                                }
                                
                            } else {
                                presetNameToUse = info.filename;
                                usingFilenameAsFallback++;
                                logFile << "  [WARNING] Failed to extract from: " << filename << std::endl;
                            }
                            
                            presetData.exactMap[presetNameToUse] = presetNameToUse;
                            presetData.allValidNames.insert(presetNameToUse);
                            
                            presetData.allValidNames.insert(info.filename);
                            
                            std::string normalized = NormalizePresetNameFlexible(presetNameToUse);
                            if (!normalized.empty()) {
                                if (presetData.normalizedMap.find(normalized) == presetData.normalizedMap.end()) {
                                    presetData.normalizedMap[normalized] = presetNameToUse;
                                }
                            }
                            
                            std::string normalizedFilename = NormalizePresetNameFlexible(info.filename);
                            if (!normalizedFilename.empty()) {
                                if (presetData.normalizedMap.find(normalizedFilename) == presetData.normalizedMap.end()) {
                                    presetData.normalizedMap[normalizedFilename] = presetNameToUse;
                                }
                            }
                        } catch (const std::exception& e) {
                            logFile << "  [ERROR] Exception processing " << filename << ": " << e.what() << std::endl;
                        } catch (...) {
                            logFile << "  [ERROR] Unknown exception processing " << filename << std::endl;
                        }
                    }
                }
            } catch (const std::exception& e) {
                logFile << "  [ERROR] Exception in directory iteration: " << e.what() << std::endl;
                continue;
            } catch (...) {
                logFile << "  [ERROR] Unknown exception in directory iteration" << std::endl;
                continue;
            }
        }
        
        logFile << std::endl;
        logFile << "Smart Cleaning: Preset Map Building Summary" << std::endl;
        logFile << "  Total XML files found: " << totalXmlFiles << std::endl;
        logFile << "  Successful name extractions: " << successfulExtractions << std::endl;
        logFile << "  Failed extractions (using filename): " << usingFilenameAsFallback << std::endl;
        logFile << "  Filename read failures: " << filenameFailed << std::endl;
        logFile << "  Total unique presets in map: " << presetData.exactMap.size() << std::endl;
        logFile << "  Total valid names (including filenames): " << presetData.allValidNames.size() << std::endl;
        logFile << std::endl;
        
    } catch (const std::exception& e) {
        logFile << "ERROR in BuildPresetNameMap: " << e.what() << std::endl;
    } catch (...) {
        logFile << "ERROR in BuildPresetNameMap: Unknown exception" << std::endl;
    }
    
    return presetData;
}

PresetMatchResult FindPresetMatch(const std::string& jsonPresetName, 
                                   const PresetMapData& presetData,
                                   std::ofstream& logFile) {
    PresetMatchResult result;
    
    if (jsonPresetName.empty()) {
        return result;
    }
    
    std::string cleanPresetName = jsonPresetName;
    if (!cleanPresetName.empty() && cleanPresetName[0] == '!') {
        cleanPresetName = cleanPresetName.substr(1);
    }
    
    auto exactIt = presetData.exactMap.find(cleanPresetName);
    if (exactIt != presetData.exactMap.end()) {
        result.found = true;
        result.actualPresetName = exactIt->second;
        result.matchLevel = 1;
        return result;
    }
    
    std::string decodedCleanName = DecodeHtmlEntities(cleanPresetName);
    if (decodedCleanName != cleanPresetName) {
        auto decodedIt = presetData.exactMap.find(decodedCleanName);
        if (decodedIt != presetData.exactMap.end()) {
            result.found = true;
            result.actualPresetName = decodedIt->second;
            result.matchLevel = 2;
            logFile << "    [INFO] Matched with HTML entity decoding: " 
                    << cleanPresetName << " -> " << decodedCleanName << std::endl;
            return result;
        }
    }
    
    std::string normalizedJsonName = NormalizePresetNameFlexible(cleanPresetName);
    for (const auto& [xmlName, actualName] : presetData.exactMap) {
        std::string normalizedXmlName = NormalizePresetNameFlexible(xmlName);
        if (normalizedJsonName == normalizedXmlName) {
            result.found = true;
            result.actualPresetName = actualName;
            result.matchLevel = 3;
            logFile << "    [INFO] Matched with normalization: " 
                    << cleanPresetName << " -> " << actualName << std::endl;
            return result;
        }
    }
    
    if (presetData.allValidNames.find(cleanPresetName) != presetData.allValidNames.end()) {
        auto filenameIt = presetData.filenameToInternalMap.find(cleanPresetName);
        if (filenameIt != presetData.filenameToInternalMap.end()) {
            result.found = true;
            result.actualPresetName = filenameIt->second;
            result.matchLevel = 4;
            return result;
        } else {
            result.found = true;
            result.actualPresetName = cleanPresetName;
            result.matchLevel = 4;
            return result;
        }
    }
    
    std::string normalized = NormalizePresetNameFlexible(cleanPresetName);
    if (!normalized.empty()) {
        auto normalizedIt = presetData.normalizedMap.find(normalized);
        if (normalizedIt != presetData.normalizedMap.end()) {
            result.found = true;
            result.actualPresetName = normalizedIt->second;
            result.matchLevel = 5;
            return result;
        }
    }
    
    std::vector<std::string> variations;
    variations.push_back(cleanPresetName);
    
    variations.push_back(Trim(cleanPresetName));
    
    std::string noSpaces = cleanPresetName;
    noSpaces.erase(std::remove(noSpaces.begin(), noSpaces.end(), ' '), noSpaces.end());
    variations.push_back(noSpaces);
    
    std::string lowerCase = ToLowerCase(cleanPresetName);
    variations.push_back(lowerCase);
    
    for (const auto& variation : variations) {
        if (presetData.allValidNames.find(variation) != presetData.allValidNames.end()) {
            result.found = true;
            result.actualPresetName = variation;
            result.matchLevel = 6;
            return result;
        }
    }
    
    return result;
}

void PerformSmartCleaning(std::map<std::string, OrderedPluginData>& processedData,
                          const ConfigSettings& config,
                          const fs::path& bodySlidePresetsPath,
                          std::ofstream& logFile,
                          std::vector<std::string>& missingPresetsFromIni) {
    
    bool anyCleaningEnabled = config.presetsSmartCleaning || 
                              config.blacklistedPresetsSmartCleaningFromRandomDistribution ||
                              config.blacklistedPresetsSmartCleaningFromAll ||
                              config.outfitsForceReSmartCleaning;
    
    if (!anyCleaningEnabled) {
        logFile << "Smart Cleaning: All cleaning options disabled in configuration" << std::endl;
        return;
    }
    
    logFile << std::endl;
    logFile << "Performing Smart Cleaning with Intelligent Preset Matching..." << std::endl;
    logFile << "----------------------------------------------------" << std::endl;
    
    PresetMapData presetData = BuildPresetNameMap(bodySlidePresetsPath, logFile);
    
    if (presetData.exactMap.empty()) {
        logFile << "Smart Cleaning: No presets found in BodySlide folder, skipping cleaning" << std::endl;
        return;
    }
    
    int totalPresetsRemoved = 0;
    int totalPresetsKept = 0;
    int totalPresetsCorrected = 0;
    std::set<std::string> removedPresets;
    std::map<std::string, std::string> correctedPresets;
    
    if (config.presetsSmartCleaning) {
        logFile << "Cleaning regular presets (npcFormID, npc, faction, raceFemale, raceMale, etc)..." << std::endl;
        
        const std::vector<std::string> keysToClean = {
            "npcFormID", "npc", "factionFemale", "factionMale",
            "npcPluginFemale", "npcPluginMale", "raceFemale", "raceMale"
        };
        
        for (const auto& key : keysToClean) {
            auto& data = processedData[key];
            std::vector<std::pair<std::string, std::vector<std::string>>> cleanedData;
            
            for (auto& [plugin, presets] : data.orderedData) {
                std::vector<std::string> cleanedPresets;
                
                for (const auto& preset : presets) {
                    std::string cleanPreset = preset;
                    bool hasExclamation = false;
                    
                    if (!cleanPreset.empty() && cleanPreset[0] == '!') {
                        cleanPreset = cleanPreset.substr(1);
                        hasExclamation = true;
                    }
                    
                    PresetMatchResult matchResult = FindPresetMatch(cleanPreset, presetData, logFile);
                    
                    if (matchResult.found) {
                        std::string finalPresetName = matchResult.actualPresetName;
                        
                        if (hasExclamation && (finalPresetName.empty() || finalPresetName[0] != '!')) {
                            finalPresetName = "!" + finalPresetName;
                        }
                        
                        cleanedPresets.push_back(finalPresetName);
                        totalPresetsKept++;
                        
                        if (preset != finalPresetName) {
                            totalPresetsCorrected++;
                            correctedPresets[preset] = finalPresetName;
                            logFile << "  Corrected in " << key << "/" << plugin << ": \"" 
                                    << preset << "\" -> \"" << finalPresetName << "\" (Level " 
                                    << matchResult.matchLevel << " match)" << std::endl;
                        }
                    } else {
                        removedPresets.insert(cleanPreset);
                        totalPresetsRemoved++;
                        logFile << "  Removed from " << key << "/" << plugin << ": " << cleanPreset << std::endl;
                        
                        if (std::find(missingPresetsFromIni.begin(), missingPresetsFromIni.end(), cleanPreset) == missingPresetsFromIni.end()) {
                            missingPresetsFromIni.push_back(cleanPreset);
                        }
                    }
                }
                
                if (!cleanedPresets.empty()) {
                    cleanedData.emplace_back(plugin, cleanedPresets);
                }
            }
            
            data.orderedData = cleanedData;
        }
    }
    
    if (config.blacklistedPresetsSmartCleaningFromRandomDistribution) {
        logFile << "Cleaning blacklistedPresetsFromRandomDistribution..." << std::endl;
        
        auto& data = processedData["blacklistedPresetsFromRandomDistribution"];
        std::vector<std::pair<std::string, std::vector<std::string>>> cleanedData;
        
        for (auto& [plugin, presets] : data.orderedData) {
            std::vector<std::string> cleanedPresets;
            
            for (const auto& preset : presets) {
                std::string cleanPreset = preset;
                bool hasExclamation = false;
                
                if (!cleanPreset.empty() && cleanPreset[0] == '!') {
                    cleanPreset = cleanPreset.substr(1);
                    hasExclamation = true;
                }
                
                bool isProtected = false;
                for (const auto& protectedPreset : PROTECTED_FROM_CLEANING) {
                    if (cleanPreset == protectedPreset) {
                        isProtected = true;
                        break;
                    }
                }
                
                if (isProtected) {
                    cleanedPresets.push_back(preset);
                    totalPresetsKept++;
                    logFile << "  Protected preset kept in blacklistedPresetsFromRandomDistribution: " << cleanPreset << std::endl;
                } else {
                    PresetMatchResult matchResult = FindPresetMatch(cleanPreset, presetData, logFile);
                    
                    if (matchResult.found) {
                        std::string finalPresetName = matchResult.actualPresetName;
                        
                        if (hasExclamation && (finalPresetName.empty() || finalPresetName[0] != '!')) {
                            finalPresetName = "!" + finalPresetName;
                        }
                        
                        cleanedPresets.push_back(finalPresetName);
                        totalPresetsKept++;
                        
                        if (preset != finalPresetName) {
                            totalPresetsCorrected++;
                            correctedPresets[preset] = finalPresetName;
                            logFile << "  Corrected in blacklistedPresetsFromRandomDistribution: \"" 
                                    << preset << "\" -> \"" << finalPresetName << "\" (Level " 
                                    << matchResult.matchLevel << " match)" << std::endl;
                        }
                    } else {
                        removedPresets.insert(cleanPreset);
                        totalPresetsRemoved++;
                        logFile << "  Removed from blacklistedPresetsFromRandomDistribution: " << cleanPreset << std::endl;
                        
                        if (std::find(missingPresetsFromIni.begin(), missingPresetsFromIni.end(), cleanPreset) == missingPresetsFromIni.end()) {
                            missingPresetsFromIni.push_back(cleanPreset);
                        }
                    }
                }
            }
            
            if (!cleanedPresets.empty()) {
                cleanedData.emplace_back(plugin, cleanedPresets);
            }
        }
        
        data.orderedData = cleanedData;
    }
    
    if (config.blacklistedPresetsSmartCleaningFromAll) {
        logFile << "Cleaning other blacklisted sections..." << std::endl;
        
        const std::vector<std::string> blacklistKeysToClean = {
            "blacklistedNpcs", "blacklistedNpcsFormID", "blacklistedNpcsPluginFemale", 
            "blacklistedNpcsPluginMale", "blacklistedRacesFemale", "blacklistedRacesMale",
            "blacklistedOutfitsFromORefitFormID", "blacklistedOutfitsFromORefit",
            "blacklistedOutfitsFromORefitPlugin"
        };
        
        for (const auto& key : blacklistKeysToClean) {
            auto& data = processedData[key];
            std::vector<std::pair<std::string, std::vector<std::string>>> cleanedData;
            
            for (auto& [plugin, presets] : data.orderedData) {
                std::vector<std::string> cleanedPresets;
                
                for (const auto& preset : presets) {
                    std::string cleanPreset = preset;
                    bool hasExclamation = false;
                    
                    if (!cleanPreset.empty() && cleanPreset[0] == '!') {
                        cleanPreset = cleanPreset.substr(1);
                        hasExclamation = true;
                    }
                    
                    bool isProtected = false;
                    for (const auto& protectedPreset : PROTECTED_FROM_CLEANING) {
                        if (cleanPreset == protectedPreset) {
                            isProtected = true;
                            break;
                        }
                    }
                    
                    if (isProtected) {
                        cleanedPresets.push_back(preset);
                        totalPresetsKept++;
                        logFile << "  Protected preset kept in " << key << ": " << cleanPreset << std::endl;
                    } else {
                        PresetMatchResult matchResult = FindPresetMatch(cleanPreset, presetData, logFile);
                        
                        if (matchResult.found) {
                            std::string finalPresetName = matchResult.actualPresetName;
                            
                            if (hasExclamation && (finalPresetName.empty() || finalPresetName[0] != '!')) {
                                finalPresetName = "!" + finalPresetName;
                            }
                            
                            cleanedPresets.push_back(finalPresetName);
                            totalPresetsKept++;
                            
                            if (preset != finalPresetName) {
                                totalPresetsCorrected++;
                                correctedPresets[preset] = finalPresetName;
                                logFile << "  Corrected in " << key << ": \"" 
                                        << preset << "\" -> \"" << finalPresetName << "\" (Level " 
                                        << matchResult.matchLevel << " match)" << std::endl;
                            }
                        } else {
                            removedPresets.insert(cleanPreset);
                            totalPresetsRemoved++;
                            logFile << "  Removed from " << key << ": " << cleanPreset << std::endl;
                            
                            if (std::find(missingPresetsFromIni.begin(), missingPresetsFromIni.end(), cleanPreset) == missingPresetsFromIni.end()) {
                                missingPresetsFromIni.push_back(cleanPreset);
                            }
                        }
                    }
                }
                
                if (!cleanedPresets.empty()) {
                    cleanedData.emplace_back(plugin, cleanedPresets);
                }
            }
            
            data.orderedData = cleanedData;
        }
    }
    
    if (config.outfitsForceReSmartCleaning) {
        logFile << "Cleaning outfitsForceRefit sections..." << std::endl;
        
        const std::vector<std::string> outfitKeysToClean = {
            "outfitsForceRefitFormID", "outfitsForceRefit"
        };
        
        for (const auto& key : outfitKeysToClean) {
            auto& data = processedData[key];
            std::vector<std::pair<std::string, std::vector<std::string>>> cleanedData;
            
            for (auto& [plugin, presets] : data.orderedData) {
                std::vector<std::string> cleanedPresets;
                
                for (const auto& preset : presets) {
                    std::string cleanPreset = preset;
                    bool hasExclamation = false;
                    
                    if (!cleanPreset.empty() && cleanPreset[0] == '!') {
                        cleanPreset = cleanPreset.substr(1);
                        hasExclamation = true;
                    }
                    
                    PresetMatchResult matchResult = FindPresetMatch(cleanPreset, presetData, logFile);
                    
                    if (matchResult.found) {
                        std::string finalPresetName = matchResult.actualPresetName;
                        
                        if (hasExclamation && (finalPresetName.empty() || finalPresetName[0] != '!')) {
                            finalPresetName = "!" + finalPresetName;
                        }
                        
                        cleanedPresets.push_back(finalPresetName);
                        totalPresetsKept++;
                        
                        if (preset != finalPresetName) {
                            totalPresetsCorrected++;
                            correctedPresets[preset] = finalPresetName;
                            logFile << "  Corrected in " << key << ": \"" 
                                    << preset << "\" -> \"" << finalPresetName << "\" (Level " 
                                    << matchResult.matchLevel << " match)" << std::endl;
                        }
                    } else {
                        removedPresets.insert(cleanPreset);
                        totalPresetsRemoved++;
                        logFile << "  Removed from " << key << ": " << cleanPreset << std::endl;
                        
                        if (std::find(missingPresetsFromIni.begin(), missingPresetsFromIni.end(), cleanPreset) == missingPresetsFromIni.end()) {
                            missingPresetsFromIni.push_back(cleanPreset);
                        }
                    }
                }
                
                if (!cleanedPresets.empty()) {
                    cleanedData.emplace_back(plugin, cleanedPresets);
                }
            }
            
            data.orderedData = cleanedData;
        }
    }
    
    logFile << std::endl;
    logFile << "Smart Cleaning Summary:" << std::endl;
    logFile << "  Total presets removed: " << totalPresetsRemoved << std::endl;
    logFile << "  Total presets kept: " << totalPresetsKept << std::endl;
    logFile << "  Total presets corrected: " << totalPresetsCorrected << std::endl;
    logFile << "  Unique presets removed: " << removedPresets.size() << std::endl;
    
    if (!missingPresetsFromIni.empty()) {
        logFile << std::endl;
        logFile << "WARNING: The following presets were referenced but not found in BodySlide folder:" << std::endl;
        logFile << "These may have been added by INI rules. Please verify if they need to be downloaded:" << std::endl;
        for (const auto& missingPreset : missingPresetsFromIni) {
            logFile << "  - " << missingPreset << std::endl;
        }
        logFile << std::endl;
        logFile << "You can search for these presets on Nexus Mods or other modding sites." << std::endl;
    }
    
    logFile << std::endl;
}

// ===== JSON VALIDATION FUNCTIONS =====

bool PerformSimpleJsonIntegrityCheck(const fs::path& jsonPath, std::ofstream& logFile) {
    try {
        logFile << "Performing SIMPLE JSON integrity check at startup..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;

        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist at: " << jsonPath.string() << std::endl;
            return false;
        }

        auto fileSize = fs::file_size(jsonPath);
        if (fileSize < 10) {
            logFile << "ERROR: JSON file is too small (" << fileSize << " bytes)" << std::endl;
            return false;
        }

        std::string content = ReadFileWithEncoding(jsonPath);
        if (content.empty()) {
            logFile << "ERROR: JSON file is empty after reading" << std::endl;
            return false;
        }

        logFile << "JSON file size: " << fileSize << " bytes" << std::endl;

        content = content.substr(content.find_first_not_of(" \t\r\n"));
        content = content.substr(0, content.find_last_not_of(" \t\r\n") + 1);

        if (content.empty() || content[0] != '{' || content[content.length() - 1] != '}') {
            logFile << "ERROR: JSON does not start with '{' or end with '}'" << std::endl;
            return false;
        }

        int braceCount = 0;
        int bracketCount = 0;
        int parenCount = 0;
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
            logFile << "ERROR: JSON appears to be corrupted or not a valid OBody config file" << std::endl;
            logFile << " Expected at least 6 OBody keys, found only " << foundKeys << std::endl;
            return false;
        }

        std::string cleanContent = content;
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

        logFile << "SUCCESS: JSON passed SIMPLE integrity check" << std::endl;
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

        std::string content = ReadFileWithEncoding(jsonPath);
        if (content.empty()) {
            logFile << "ERROR: JSON file is empty after reading" << std::endl;
            return false;
        }

        content = Trim(content);
        if (content.empty() || content[0] != '{' || content[content.length() - 1] != '}') {
            logFile << "ERROR: JSON file does not have proper structure (missing braces)" << std::endl;
            return false;
        }

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

// ===== BACKUP AND RESTORE FUNCTIONS =====

bool PerformLiteralJsonBackup(const fs::path& originalJsonPath, const fs::path& backupJsonPath,
                              std::ofstream& logFile) {
    try {
        if (!fs::exists(originalJsonPath)) {
            logFile << "ERROR: Original JSON file does not exist at: " << originalJsonPath.string() << std::endl;
            return false;
        }

        CreateDirectoryIfNotExists(backupJsonPath.parent_path());

        std::error_code ec;
        fs::copy_file(originalJsonPath, backupJsonPath, fs::copy_options::overwrite_existing, ec);

        if (ec) {
            logFile << "ERROR: Failed to copy JSON file directly: " << ec.message() << std::endl;
            return false;
        }

        try {
            auto originalSize = fs::file_size(originalJsonPath);
            auto backupSize = fs::file_size(backupJsonPath);

            if (originalSize == backupSize && originalSize > 0) {
                logFile << "SUCCESS: LITERAL JSON backup completed to: " << backupJsonPath.string() << std::endl;
                logFile << "Backup file size: " << backupSize << " bytes (verified identical to original)" << std::endl;
                return true;
            } else {
                logFile << "ERROR: Backup file size mismatch - Original: " << originalSize << ", Backup: " << backupSize
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

bool MoveCorruptedJsonToAnalysis(const fs::path& corruptedJsonPath, const fs::path& analysisDir,
                                 std::ofstream& logFile) {
    try {
        if (!fs::exists(corruptedJsonPath)) {
            logFile << "WARNING: Corrupted JSON file does not exist for analysis" << std::endl;
            return false;
        }

        CreateDirectoryIfNotExists(analysisDir);

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

bool RestoreJsonFromBackup(const fs::path& backupJsonPath, const fs::path& originalJsonPath,
                           const fs::path& analysisDir, std::ofstream& logFile) {
    try {
        if (!fs::exists(backupJsonPath)) {
            logFile << "ERROR: Backup JSON file does not exist: " << backupJsonPath.string() << std::endl;
            return false;
        }

        if (!PerformTripleValidation(backupJsonPath, fs::path(), logFile)) {
            logFile << "ERROR: Backup JSON file is also corrupted, cannot restore" << std::endl;
            return false;
        }

        logFile << "WARNING: Original JSON appears corrupted, restoring from backup..." << std::endl;

        if (fs::exists(originalJsonPath)) {
            MoveCorruptedJsonToAnalysis(originalJsonPath, analysisDir, logFile);
        }

        std::error_code ec;
        fs::copy_file(backupJsonPath, originalJsonPath, fs::copy_options::overwrite_existing, ec);

        if (ec) {
            logFile << "ERROR: Failed to restore JSON from backup: " << ec.message() << std::endl;
            return false;
        }

        if (PerformTripleValidation(originalJsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON restored from backup successfully" << std::endl;
            return true;
        } else {
            logFile << "ERROR: Restored JSON is still invalid" << std::endl;
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
// ===== NEW LOG GENERATION FUNCTIONS =====

void GenerateDoctorLog(const fs::path& bodySlidePresetsPath, const fs::path& logDoctorPath, std::ofstream& mainLogFile) {
    try {
        mainLogFile << "Generating Doctor Log..." << std::endl;
        mainLogFile << "Searching in: " << bodySlidePresetsPath.string() << std::endl;

        std::ofstream doctorLog(logDoctorPath, std::ios::out | std::ios::trunc);
        if (!doctorLog.is_open()) {
            mainLogFile << "ERROR: Could not create Doctor Log file" << std::endl;
            return;
        }

        doctorLog << "====================================================" << std::endl;
        doctorLog << "OBody NG Preset Distribution Assistant NG - Doctor" << std::endl;
        doctorLog << "====================================================" << std::endl;
        doctorLog << std::endl;

        if (!fs::exists(bodySlidePresetsPath)) {
            doctorLog << "ERROR: BodySlide presets folder not found at:" << std::endl;
            doctorLog << bodySlidePresetsPath.string() << std::endl;
            mainLogFile << "ERROR: Folder does not exist: " << bodySlidePresetsPath.string() << std::endl;
            doctorLog.close();
            return;
        }

        mainLogFile << "Folder exists, scanning files..." << std::endl;

        std::vector<std::string> xmlFiles;
        int totalScanned = 0;
        int totalXmlFound = 0;
        int filenameFailed = 0;

        try {
            for (const auto& entry : fs::directory_iterator(bodySlidePresetsPath)) {
                try {
                    totalScanned++;

                    if (entry.is_regular_file()) {
                        std::string filename;
                        try {
                            auto u8name = entry.path().filename().u8string();
                            filename = std::string(u8name.begin(), u8name.end());
                        } catch (...) {
                            try {
                                filename = entry.path().filename().string();
                            } catch (...) {
                                filenameFailed++;
                                mainLogFile << "ERROR reading filename in Doctor Log generation" << std::endl;
                                continue;
                            }
                        }

                        if (EndsWith(filename, ".xml")) {
                            xmlFiles.push_back(filename);
                            totalXmlFound++;
                        }
                    }
                } catch (const std::exception& e) {
                    mainLogFile << "ERROR reading file entry: " << e.what() << std::endl;
                } catch (...) {
                    mainLogFile << "ERROR reading file entry: Unknown exception" << std::endl;
                }
            }
        } catch (const std::exception& e) {
            mainLogFile << "ERROR iterating directory: " << e.what() << std::endl;
            doctorLog << "ERROR: Could not read directory" << std::endl;
            doctorLog.close();
            return;
        }

        mainLogFile << "Total files scanned: " << totalScanned << std::endl;
        mainLogFile << "Total XML files found: " << totalXmlFound << std::endl;
        if (filenameFailed > 0) {
            mainLogFile << "Filename read failures: " << filenameFailed << std::endl;
        }

        std::sort(xmlFiles.begin(), xmlFiles.end());

        doctorLog << "XML FILES FOUND IN SLIDER PRESETS FOLDER:" << std::endl;
        doctorLog << "Total files: " << xmlFiles.size() << std::endl;
        doctorLog << std::endl;

        for (const auto& xmlFile : xmlFiles) {
            doctorLog << xmlFile << std::endl;
        }

        doctorLog << std::endl;
        doctorLog << "====================================================" << std::endl;

        doctorLog.close();

        if (doctorLog.fail()) {
            mainLogFile << "ERROR: Failed to write Doctor Log file" << std::endl;
        } else {
            mainLogFile << "SUCCESS: Doctor Log created with " << xmlFiles.size() << " files" << std::endl;
        }

    } catch (const std::exception& e) {
        mainLogFile << "CRITICAL ERROR in GenerateDoctorLog: " << e.what() << std::endl;
    } catch (...) {
        mainLogFile << "CRITICAL ERROR in GenerateDoctorLog: Unknown exception" << std::endl;
    }
}

void GenerateSmartCleaningLog(const PresetMapData& presetData, const fs::path& logSmartCleaningPath, std::ofstream& mainLogFile) {
    try {
        mainLogFile << "Generating Smart Cleaning Log with extracted preset names..." << std::endl;
        
        std::ofstream smartCleaningLog(logSmartCleaningPath, std::ios::out | std::ios::trunc);
        if (!smartCleaningLog.is_open()) {
            mainLogFile << "ERROR: Could not create Smart Cleaning Log file" << std::endl;
            return;
        }
        
        smartCleaningLog << "====================================================" << std::endl;
        smartCleaningLog << "Smart Cleaning Preset Reference" << std::endl;
        smartCleaningLog << "====================================================" << std::endl;
        smartCleaningLog << std::endl;
        
        std::vector<std::string> presetNames;
        for (const auto& [presetName, _] : presetData.exactMap) {
            presetNames.push_back(presetName);
        }
        
        std::sort(presetNames.begin(), presetNames.end());
        
        smartCleaningLog << "PRESET NAMES EXTRACTED FROM XML FILES (INTERNAL <Preset name=\"...\">):" << std::endl;
        smartCleaningLog << "Total presets: " << presetNames.size() << std::endl;
        smartCleaningLog << std::endl;
        
        for (const auto& presetName : presetNames) {
            smartCleaningLog << presetName << std::endl;
        }
        
        smartCleaningLog << std::endl;
        smartCleaningLog << "----------------------------------------------------" << std::endl;
        smartCleaningLog << std::endl;
        
        smartCleaningLog << "FILENAME TO INTERNAL NAME MAPPING:" << std::endl;
        smartCleaningLog << "(Shows XML filenames that differ from internal preset names)" << std::endl;
        smartCleaningLog << std::endl;
        
        int mappingCount = 0;
        for (const auto& [filename, internalName] : presetData.filenameToInternalMap) {
            if (filename != internalName) {
                smartCleaningLog << "File: " << filename << ".xml" << std::endl;
                smartCleaningLog << " -> Internal: " << internalName << std::endl;
                smartCleaningLog << std::endl;
                mappingCount++;
            }
        }
        
        if (mappingCount == 0) {
            smartCleaningLog << "All XML filenames match their internal preset names." << std::endl;
        } else {
            smartCleaningLog << "Total mappings: " << mappingCount << std::endl;
        }
        
        smartCleaningLog << std::endl;
        smartCleaningLog << "====================================================" << std::endl;
        
        smartCleaningLog.close();
        
        if (smartCleaningLog.fail()) {
            mainLogFile << "ERROR: Failed to write Smart Cleaning Log file" << std::endl;
        } else {
            mainLogFile << "SUCCESS: Smart Cleaning Log created with " << presetNames.size() << " presets at: " << logSmartCleaningPath.string() << std::endl;
        }
        
    } catch (const std::exception& e) {
        mainLogFile << "ERROR in GenerateSmartCleaningLog: " << e.what() << std::endl;
    } catch (...) {
        mainLogFile << "ERROR in GenerateSmartCleaningLog: Unknown exception" << std::endl;
    }
}

void GenerateHelperLog(const PresetMapData& presetData, const fs::path& logHelperPath, std::ofstream& mainLogFile) {
    try {
        mainLogFile << "Generating Helper Log with preset list and examples..." << std::endl;
        
        std::ofstream helperLog(logHelperPath, std::ios::out | std::ios::trunc);
        if (!helperLog.is_open()) {
            mainLogFile << "ERROR: Could not create Helper Log file" << std::endl;
            return;
        }
        
        helperLog << "====================================================" << std::endl;
        helperLog << "OBody NG Preset Distribution Assistant NG - Helper" << std::endl;
        helperLog << "====================================================" << std::endl;
        helperLog << std::endl;
        
        helperLog << "This is a complete list of all presets installed in your Skyrim." << std::endl;
        helperLog << "You can use them to create INI files and manage presets intelligently." << std::endl;
        helperLog << "It also helps you know if you have certain presets installed or not, making your life much easier." << std::endl;
        helperLog << std::endl;
        helperLog << "You can visit the wiki at:" << std::endl;
        helperLog << "https://john95ac.github.io/website-documents-John95AC/OBody_NG_Preset_Distribution_Assistant_NG/index.html" << std::endl;
        helperLog << "which includes a rule generator for INI files." << std::endl;
        helperLog << std::endl;
        helperLog << "Below are some examples of how to use the INI manager in different cases." << std::endl;
        helperLog << std::endl;
        helperLog << std::endl;

        helperLog << "====================================================" << std::endl;
        helperLog << "INSTALLED PRESETS LIST (" << presetData.exactMap.size() << " total)" << std::endl;
        helperLog << "====================================================" << std::endl;
        helperLog << std::endl;

        // Separate presets into NORMAL and UBE categories
        std::vector<std::string> normalPresets;
        std::vector<std::string> ubePresets;

        for (const auto& [presetName, _] : presetData.exactMap) {
            // Check if preset name contains "UBE" (case-insensitive)
            std::string lowerName = presetName;
            std::transform(lowerName.begin(), lowerName.end(), lowerName.begin(),
                          [](unsigned char c) { return std::tolower(c); });

            if (lowerName.find("ube") != std::string::npos) {
                ubePresets.push_back(presetName);
            } else {
                normalPresets.push_back(presetName);
            }
        }

        // Sort both lists alphabetically
        std::sort(normalPresets.begin(), normalPresets.end());
        std::sort(ubePresets.begin(), ubePresets.end());

        // Write NORMAL presets
        helperLog << "NORMAL PRESETS (CBBE/3BA/BHUNP/etc.) - " << normalPresets.size() << " total" << std::endl;
        helperLog << std::endl;

        for (const auto& preset : normalPresets) {
            helperLog << preset << std::endl;
        }

        // Write UBE presets section (only if UBE presets exist)
        if (!ubePresets.empty()) {
            helperLog << std::endl;
            helperLog << "UBE PRESETS - " << ubePresets.size() << " total" << std::endl;
            helperLog << std::endl;

            for (const auto& preset : ubePresets) {
                helperLog << preset << std::endl;
            }
        }
        
        helperLog << std::endl;
        helperLog << "----------------------------------------------------" << std::endl;
        helperLog << std::endl;
        
        helperLog << ";OBody_Preset_Distribution_Assistant-NG rules to create an INI" << std::endl;
        helperLog << ";Don't be scared, check the web or review the examples below" << std::endl;
        helperLog << std::endl;
        helperLog << ";OBodyNG_PDA_(mod_name).ini - This is the INI structure" << std::endl;
        helperLog << ";You can use the mod examples entirely or create your own INI, but you must respect the naming convention" << std::endl;
        helperLog << ";Example: OBodyNG_PDA_MyMod.ini or OBodyNG_PDA_Custom_Bodies.ini" << std::endl;
        helperLog << std::endl;
        helperLog << ";Code design examples: Very similar to SPID but shorter and simpler." << std::endl;
        helperLog << std::endl;
        helperLog << "; npcFormID = xx0001|Preset,...|x, 1, 0, -, *, empty             FormID" << std::endl;
        helperLog << "; npc = EditorID|Preset,...|x, 1, 0, -, *, empty                 EditorID name like 000Rabbit_NPC or Serana" << std::endl;
        helperLog << "; factionFemale = Faction|Preset,...|x, 1, 0, -, *, empty        Faction name like ImperialFaction or KhajiitFaction" << std::endl;
        helperLog << "; factionMale = Faction|Preset,...|x, 1, 0, -, *, empty" << std::endl;
        helperLog << "; npcPluginFemale = Plugin.esp|Preset,...|x, 1, 0, -, *, empty   The name of the ESP with defined bodies" << std::endl;
        helperLog << "; npcPluginMale = Plugin.esp|Preset,...|x, 1, 0, -, *, empty" << std::endl;
        helperLog << "; raceFemale = Race|Preset,...|x, 1, 0, -, *, empty              Works with NordRace, OrcRace, etc., and custom races" << std::endl;
        helperLog << "; raceMale = Race|Preset,...|x, 1, 0, -, *, empty" << std::endl;
        helperLog << std::endl;
        helperLog << "----------------------------------------------------" << std::endl;
        helperLog << "EXAMPLE 1: Assigning presets to NPCs via plugin" << std::endl;
        helperLog << "----------------------------------------------------" << std::endl;
        helperLog << std::endl;
        
        if (normalPresets.size() >= 2) {
            std::vector<std::string> randomPresets;
            std::random_device rd;
            std::mt19937 gen(rd());

            if (normalPresets.size() <= 5) {
                randomPresets = normalPresets;
            } else {
                std::sample(normalPresets.begin(), normalPresets.end(), std::back_inserter(randomPresets),
                           std::min(static_cast<size_t>(5), normalPresets.size()), gen);
            }
            
            helperLog << ";YurianaWench example" << std::endl;
            helperLog << "npcPluginFemale = YurianaWench.esp|";
            for (size_t i = 0; i < randomPresets.size() && i < 2; i++) {
                if (i > 0) helperLog << ",";
                helperLog << randomPresets[i];
            }
            helperLog << "|" << std::endl;
            helperLog << std::endl;
            
            helperLog << ";Immersive Wenches example" << std::endl;
            helperLog << "npcPluginFemale = Immersive Wenches.esp|";
            for (size_t i = 0; i < randomPresets.size() && i < 2; i++) {
                if (i > 0) helperLog << ",";
                helperLog << randomPresets[i];
            }
            helperLog << "|" << std::endl;
            helperLog << std::endl;
            
            helperLog << "These two examples assign bodies to all NPCs in those plugins." << std::endl;
            helperLog << "You can use 1 or multiple presets - OBody will randomly choose among them for assignment." << std::endl;
            helperLog << std::endl;
            helperLog << "Note: The elements at the end are only for advanced users who want sequences." << std::endl;
            helperLog << "It's not necessary to apply anything - in fact, it's highly recommended to leave it empty." << std::endl;
            helperLog << std::endl;
            
            helperLog << "----------------------------------------------------" << std::endl;
            helperLog << "EXAMPLE 2: Assigning presets to entire races" << std::endl;
            helperLog << "----------------------------------------------------" << std::endl;
            helperLog << std::endl;
            
            helperLog << "Another very useful example is assigning a set of body presets to complete races." << std::endl;
            helperLog << "Here's an example with your presets (minimum 5 random selections per race):" << std::endl;
            helperLog << std::endl;
            
            const std::vector<std::string> races = {
                "NordRace", "ImperialRace", "BretonRace", "RedguardRace", "DarkElfRace",
                "HighElfRace", "WoodElfRace", "OrcRace", "KhajiitRace", "ArgonianRace", "ElderRace"
            };
            
            for (const auto& race : races) {
                std::vector<std::string> raceRandomPresets;

                if (normalPresets.size() <= 5) {
                    raceRandomPresets = normalPresets;
                } else {
                    std::sample(normalPresets.begin(), normalPresets.end(), std::back_inserter(raceRandomPresets),
                               std::min(static_cast<size_t>(5), normalPresets.size()), gen);
                }
                
                helperLog << ";" << race << std::endl;
                helperLog << "raceFemale = " << race << "|";
                
                for (size_t i = 0; i < raceRandomPresets.size(); i++) {
                    if (i > 0) helperLog << ",";
                    helperLog << raceRandomPresets[i];
                }
                
                helperLog << "|" << std::endl;
                helperLog << std::endl;
            }
            
            helperLog << "----------------------------------------------------" << std::endl;
            helperLog << "AVAILABLE RACES (including vampire variants)" << std::endl;
            helperLog << "----------------------------------------------------" << std::endl;
            helperLog << std::endl;
            
            const std::vector<std::string> allRaces = {
                "NordRace", "ImperialRace", "BretonRace", "RedguardRace", "DarkElfRace",
                "HighElfRace", "WoodElfRace", "OrcRace", "KhajiitRace", "ArgonianRace", "ElderRace",
                "NordRaceVampire", "ImperialRaceVampire", "BretonRaceVampire", "RedguardRaceVampire",
                "DarkElfRaceVampire", "HighElfRaceVampire", "WoodElfRaceVampire", "OrcRaceVampire",
                "KhajiitRaceVampire", "ArgonianRaceVampire", "ElderRaceVampire"
            };
            
            for (const auto& race : allRaces) {
                helperLog << race << std::endl;
            }
            
            helperLog << std::endl;
        } else {
            helperLog << "Not enough presets installed to generate examples." << std::endl;
            helperLog << "Install more BodySlide presets and run again." << std::endl;
            helperLog << std::endl;
        }
        
        helperLog << "----------------------------------------------------" << std::endl;
        helperLog << "FINAL NOTES" << std::endl;
        helperLog << "----------------------------------------------------" << std::endl;
        helperLog << std::endl;
        helperLog << "As you can see, it's not complicated and you can leave those rules in an INI file," << std::endl;
        helperLog << "and the mod will read and preset them automatically." << std::endl;
        helperLog << std::endl;
        helperLog << "If you have UBE presets, the mod automatically places them in the blacklist to avoid errors," << std::endl;
        helperLog << "and you can distribute them wherever you want. It also distributes them to all UBE NPCs randomly," << std::endl;
        helperLog << "but you can use npcPluginFemale to apply UBE to particular NPCs." << std::endl;
        helperLog << "You can also use FormIDs or NPC names, but the plugin method never fails." << std::endl;
        helperLog << std::endl;
        helperLog << "Remember when creating an INI, it must follow this format:" << std::endl;
        helperLog << "OBodyNG_PDA_(mod_name).ini" << std::endl;
        helperLog << std::endl;
        helperLog << "When choosing a unique name for your INI, you can use the examples provided with the mod" << std::endl;
        helperLog << "to avoid creating one from scratch. The name must use underscores (_) as separators" << std::endl;
        helperLog << "to ensure proper search functionality." << std::endl;
        helperLog << std::endl;
        helperLog << "That's it! Thank you for using my mod, and I hope it serves you well. Good luck!" << std::endl;
        helperLog << std::endl;
        helperLog << "====================================================" << std::endl;
        
        helperLog.close();
        
        if (helperLog.fail()) {
            mainLogFile << "ERROR: Failed to write Helper Log file" << std::endl;
        } else {
            mainLogFile << "SUCCESS: Helper Log created successfully at: " << logHelperPath.string() << std::endl;
        }
        
    } catch (const std::exception& e) {
        mainLogFile << "ERROR in GenerateHelperLog: " << e.what() << std::endl;
    } catch (...) {
        mainLogFile << "ERROR in GenerateHelperLog: Unknown exception" << std::endl;
    }
}

// ===== IMPROVED UBE XML PROCESSING FUNCTIONS =====

struct XmlAnalysisResult {
    bool hasUBE = false;
    bool hasConflictingGroups = false;
    std::vector<std::string> conflictingGroupsFound;
};

XmlAnalysisResult AnalyzeXmlGroups(const fs::path& xmlPath, std::ofstream& logFile) {
    XmlAnalysisResult result;
    
    try {
        if (!fs::exists(xmlPath)) return result;
        
        std::string content = ReadFileWithEncoding(xmlPath);
        if (content.empty()) return result;
        
        std::string lowerContent = content;
        std::transform(lowerContent.begin(), lowerContent.end(), lowerContent.begin(), ::tolower);
        
        if (lowerContent.find("<group name=\"ube\"") != std::string::npos ||
            lowerContent.find("<group name='ube'") != std::string::npos) {
            result.hasUBE = true;
        }
        
        const std::vector<std::string> conflictingPatterns = {
            "3ba", "3bbb", "cbbe"
        };
        
        size_t pos = 0;
        while (pos < lowerContent.length()) {
            size_t groupStart = lowerContent.find("<group name=", pos);
            if (groupStart == std::string::npos) break;
            
            size_t nameStart = lowerContent.find_first_of("\"'", groupStart);
            if (nameStart == std::string::npos) break;
            
            char quoteChar = lowerContent[nameStart];
            size_t nameEnd = lowerContent.find(quoteChar, nameStart + 1);
            if (nameEnd == std::string::npos) break;
            
            std::string groupName = lowerContent.substr(nameStart + 1, nameEnd - nameStart - 1);
            
            for (const auto& pattern : conflictingPatterns) {
                if (groupName.find(pattern) != std::string::npos) {
                    result.hasConflictingGroups = true;
                    std::string originalGroupName = content.substr(nameStart + 1, nameEnd - nameStart - 1);
                    if (std::find(result.conflictingGroupsFound.begin(), result.conflictingGroupsFound.end(), 
                                 originalGroupName) == result.conflictingGroupsFound.end()) {
                        result.conflictingGroupsFound.push_back(originalGroupName);
                    }
                    break;
                }
            }
            
            pos = nameEnd + 1;
        }
        
        return result;
        
    } catch (...) {
        logFile << "ERROR analyzing XML groups: " << xmlPath.string() << std::endl;
        return result;
    }
}

struct UBEPresetInfo {
    std::string presetName;
    bool allowedInRaces;
    bool hasConflict;
    std::vector<std::string> conflictingGroups;
};

std::pair<std::vector<std::string>, std::vector<UBEPresetInfo>> ProcessUBEXmlPresets(
    const fs::path& bodySlidePresetsPath, std::ofstream& logFile) {
    
    std::vector<std::string> allUBEPresetsForBlacklist;
    std::vector<UBEPresetInfo> ubePresetsInfo;
    std::vector<std::string> excludedFromRacesXmlFiles;
    
    try {
        if (!fs::exists(bodySlidePresetsPath)) {
            logFile << "WARNING: BodySlide presets folder not found: " << bodySlidePresetsPath.string() << std::endl;
            return {allUBEPresetsForBlacklist, ubePresetsInfo};
        }
        
        logFile << std::endl;
        logFile << "Scanning for UBE XML presets..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;
        
        int totalXmlScanned = 0;
        int totalUbeFound = 0;
        int totalConflicting = 0;
        int conflictingButNameHasUBE = 0;
        
        for (const auto& entry : fs::directory_iterator(bodySlidePresetsPath)) {
            try {
                if (entry.is_regular_file()) {
                    std::string filename;
                    try {
                        auto u8name = entry.path().filename().u8string();
                        filename = std::string(u8name.begin(), u8name.end());
                    } catch (...) {
                        try {
                            filename = entry.path().filename().string();
                        } catch (...) {
                            continue;
                        }
                    }

                    if (EndsWith(filename, ".xml")) {
                        totalXmlScanned++;
                        
                        try {
                            XmlAnalysisResult analysis = AnalyzeXmlGroups(entry.path(), logFile);
                            
                            if (analysis.hasUBE) {
                                std::string presetName = ExtractPresetNameFromXml(entry.path(), logFile);
                                
                                if (presetName.empty()) {
                                    logFile << "  WARNING: Could not extract preset name from: " << filename << std::endl;
                                    continue;
                                }
                                
                                std::string lowerPresetName = presetName;
                                std::transform(lowerPresetName.begin(), lowerPresetName.end(), 
                                             lowerPresetName.begin(), ::tolower);
                                bool filenameContainsUBE = (lowerPresetName.find("ube") != std::string::npos);
                                
                                if (analysis.hasConflictingGroups) {
                                    totalConflicting++;
                                    
                                    UBEPresetInfo info;
                                    info.presetName = presetName;
                                    info.hasConflict = true;
                                    info.conflictingGroups = analysis.conflictingGroupsFound;
                                    info.allowedInRaces = filenameContainsUBE;
                                    
                                    allUBEPresetsForBlacklist.push_back(presetName);
                                    
                                    if (filenameContainsUBE) {
                                        ubePresetsInfo.push_back(info);
                                        conflictingButNameHasUBE++;
                                        logFile << "  CONFLICT DETECTED (preset name has UBE, added to races): " << presetName << " (" << filename << ")" << std::endl;
                                    } else {
                                        excludedFromRacesXmlFiles.push_back(filename);
                                        logFile << "  CONFLICT DETECTED (excluded from races): " << presetName << " (" << filename << ")" << std::endl;
                                    }
                                    
                                    logFile << "    Has UBE group but also contains: ";
                                    for (size_t i = 0; i < analysis.conflictingGroupsFound.size(); i++) {
                                        logFile << analysis.conflictingGroupsFound[i];
                                        if (i < analysis.conflictingGroupsFound.size() - 1) {
                                            logFile << ", ";
                                        }
                                    }
                                    logFile << std::endl;
                                } else {
                                    UBEPresetInfo info;
                                    info.presetName = presetName;
                                    info.hasConflict = false;
                                    info.allowedInRaces = true;
                                    
                                    allUBEPresetsForBlacklist.push_back(presetName);
                                    ubePresetsInfo.push_back(info);
                                    totalUbeFound++;
                                    logFile << "  Found UBE preset: " << presetName << " (" << filename << ")" << std::endl;
                                }
                            }
                        } catch (const std::exception& e) {
                            logFile << "  [ERROR] Exception processing UBE in " << filename << ": " << e.what() << std::endl;
                        } catch (...) {
                            logFile << "  [ERROR] Unknown exception processing UBE in " << filename << std::endl;
                        }
                    }
                }
            } catch (const std::exception& e) {
                logFile << "  [ERROR] Exception in UBE directory iteration: " << e.what() << std::endl;
                continue;
            } catch (...) {
                logFile << "  [ERROR] Unknown exception in UBE directory iteration" << std::endl;
                continue;
            }
        }

        logFile << std::endl;
        logFile << "UBE XML Scan Summary:" << std::endl;
        logFile << "  Total XML files scanned: " << totalXmlScanned << std::endl;
        logFile << "  Valid UBE presets found: " << totalUbeFound << std::endl;
        logFile << "  Conflicting presets (UBE + 3BA/3BBB/CBBE): " << totalConflicting << std::endl;
        logFile << "  Conflicting but preset name has UBE (added to races): " << conflictingButNameHasUBE << std::endl;
        logFile << "  Total presets for blacklist: " << allUBEPresetsForBlacklist.size() << std::endl;
        logFile << "  Total presets for UBE races: " << ubePresetsInfo.size() << std::endl;
        
        if (totalConflicting > 0) {
            logFile << std::endl;
            logFile << "WARNING: The following presets have both UBE and 3BA/3BBB/CBBE indicators:" << std::endl;
            logFile << "All conflicting presets were added to blacklist." << std::endl;
            logFile << "Presets with 'UBE' in name were also added to UBE races." << std::endl;
            logFile << "Presets without 'UBE' in name were excluded from UBE races." << std::endl;
            logFile << "You can manually add excluded presets via INI rules if needed." << std::endl;
            logFile << std::endl;
        }
        
        if (!excludedFromRacesXmlFiles.empty()) {
            logFile << std::endl;
            logFile << "XML FILES EXCLUDED FROM UBE RACES:" << std::endl;
            logFile << "----------------------------------------------------" << std::endl;
            logFile << "The following XML files contain UBE groups but were excluded from UBE races" << std::endl;
            logFile << "because they also contain 3BA/3BBB/CBBE groups and don't have 'UBE' in the preset name." << std::endl;
            logFile << "Please review these files to determine if they are intended for UBE." << std::endl;
            logFile << std::endl;
            
            for (const auto& xmlFile : excludedFromRacesXmlFiles) {
                logFile << "  - " << xmlFile << std::endl;
            }
            
            logFile << std::endl;
            logFile << "If any of these presets should be included in UBE races, you can:" << std::endl;
            logFile << "  1. Rename the preset name inside XML to include 'UBE'" << std::endl;
            logFile << "  2. Manually add them using INI rules in OBodyNG_PDA_*.ini files" << std::endl;
            logFile << "  3. Contact the preset author to clarify the intended body type" << std::endl;
            logFile << std::endl;
        }
        
        logFile << std::endl;
        
    } catch (const std::exception& e) {
        logFile << "ERROR scanning BodySlide presets: " << e.what() << std::endl;
    } catch (...) {
        logFile << "ERROR scanning BodySlide presets: Unknown exception" << std::endl;
    }
    
    return {allUBEPresetsForBlacklist, ubePresetsInfo};
}

bool ApplyUBEPresetsToJson(std::map<std::string, OrderedPluginData>& processedData,
                           const std::vector<std::string>& allPresetsForBlacklist,
                           const std::vector<UBEPresetInfo>& presetsForRaces,
                           std::ofstream& logFile) {
    if (allPresetsForBlacklist.empty()) {
        logFile << "No UBE presets to apply (none found)" << std::endl;
        return false;
    }
    
    try {
        logFile << "Applying UBE presets to JSON..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;
        
        int presetsAddedToBlacklist = 0;
        int racesCreatedOrUpdated = 0;
        int totalPresetsAddedToRaces = 0;
        int excludedPresetsCount = 0;
        
        auto& blacklistData = processedData["blacklistedPresetsFromRandomDistribution"];
        
        for (const auto& presetName : allPresetsForBlacklist) {
            bool alreadyExists = false;
            for (const auto& [plugin, presets] : blacklistData.orderedData) {
                if (std::find(presets.begin(), presets.end(), presetName) != presets.end()) {
                    alreadyExists = true;
                    break;
                }
            }
            
            if (!alreadyExists) {
                blacklistData.addPreset("", presetName);
                presetsAddedToBlacklist++;
                logFile << "  Added to blacklist: " << presetName << std::endl;
            }
        }
        
        auto& raceFemaleData = processedData["raceFemale"];
        
        for (const auto& ubeRace : UBE_RACES) {
            bool raceWasCreated = !raceFemaleData.hasPlugin(ubeRace);
            int presetsAddedToThisRace = 0;
            
            for (const auto& presetInfo : presetsForRaces) {
                if (!presetInfo.allowedInRaces) {
                    continue;
                }
                
                const std::string& presetName = presetInfo.presetName;
                
                bool isExcluded = std::find(EXCLUDED_FROM_UBE_RACES.begin(), EXCLUDED_FROM_UBE_RACES.end(), 
                                           presetName) != EXCLUDED_FROM_UBE_RACES.end();
                
                if (isExcluded) {
                    if (raceWasCreated && presetsAddedToThisRace == 0) {
                        excludedPresetsCount++;
                    }
                    continue;
                }
                
                bool presetExists = false;
                for (const auto& [race, presets] : raceFemaleData.orderedData) {
                    if (race == ubeRace) {
                        if (std::find(presets.begin(), presets.end(), presetName) != presets.end()) {
                            presetExists = true;
                            break;
                        }
                    }
                }
                
                if (!presetExists) {
                    raceFemaleData.addPreset(ubeRace, presetName);
                    presetsAddedToThisRace++;
                    totalPresetsAddedToRaces++;
                }
            }
            
            if (raceWasCreated && presetsAddedToThisRace > 0) {
                racesCreatedOrUpdated++;
                logFile << "  Created race: " << ubeRace << " with " << presetsAddedToThisRace << " presets"
                        << std::endl;
            } else if (presetsAddedToThisRace > 0) {
                logFile << "  Updated race: " << ubeRace << " (+" << presetsAddedToThisRace << " presets)"
                        << std::endl;
            }
        }
        
        logFile << std::endl;
        logFile << "UBE Application Summary:" << std::endl;
        logFile << "  Presets added to blacklist: " << presetsAddedToBlacklist << std::endl;
        logFile << "  UBE races created/updated: " << racesCreatedOrUpdated << std::endl;
        logFile << "  Total presets added to races: " << totalPresetsAddedToRaces << std::endl;
        if (excludedPresetsCount > 0) {
            logFile << "  Presets excluded from UBE races (Zeroed Sliders variants): " 
                    << excludedPresetsCount << std::endl;
        }
        logFile << std::endl;
        
        return (presetsAddedToBlacklist > 0 || totalPresetsAddedToRaces > 0);
        
    } catch (const std::exception& e) {
        logFile << "ERROR in ApplyUBEPresetsToJson: " << e.what() << std::endl;
        return false;
    } catch (...) {
        logFile << "ERROR in ApplyUBEPresetsToJson: Unknown exception" << std::endl;
        return false;
    }
}


// ===== JSON INDENTATION CORRECTION =====

bool CorrectJsonIndentation(const fs::path& jsonPath, const fs::path& analysisDir, std::ofstream& logFile) {
    try {
        logFile << "Checking and correcting JSON indentation hierarchy..." << std::endl;
        logFile << "----------------------------------------------------" << std::endl;

        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist for indentation correction" << std::endl;
            return false;
        }

        std::string originalContent = ReadFileWithEncoding(jsonPath);
        if (originalContent.empty()) {
            logFile << "ERROR: JSON file is empty for indentation correction" << std::endl;
            return false;
        }

        bool needsCorrection = false;
        std::vector<std::string> lines;
        std::stringstream ss(originalContent);
        std::string line;

        while (std::getline(ss, line)) {
            lines.push_back(line);
        }

        for (const auto& currentLine : lines) {
            if (currentLine.empty()) continue;
            if (currentLine.find_first_not_of(" \t") == std::string::npos) continue;

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

            if (leadingTabs > 0 || (leadingSpaces > 0 && leadingSpaces % 4 != 0)) {
                needsCorrection = true;
                break;
            }
        }

        if (!needsCorrection) {
            for (size_t i = 0; i < lines.size() - 1; i++) {
                std::string currentTrimmed = Trim(lines[i]);

                if (EndsWith(currentTrimmed, "{") || EndsWith(currentTrimmed, "[")) {
                    char openChar = currentTrimmed.back();
                    char closeChar = (openChar == '{') ? '}' : ']';

                    for (size_t j = i + 1; j < lines.size(); j++) {
                        std::string nextTrimmed = Trim(lines[j]);

                        if (nextTrimmed == std::string(1, closeChar) ||
                            nextTrimmed == std::string(1, closeChar) + ",") {
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

        std::ostringstream correctedJson;
        int indentLevel = 0;
        bool inString = false;
        bool escape = false;

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
                            std::string between = originalContent.substr(startPos + 1, pos - startPos - 1);
                            std::string trimmedBetween = Trim(between);
                            return trimmedBetween.empty();
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
                    if (isEmptyBlock(i, c, (c == '{') ? '}' : ']')) {
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

                        correctedJson << c << ((c == '{') ? '}' : ']');
                        i = pos - 1;

                        if (i + 1 < originalContent.length()) {
                            size_t nextNonSpace = i + 1;
                            while (nextNonSpace < originalContent.length() &&
                                   std::isspace(static_cast<unsigned char>(originalContent[nextNonSpace]))) {
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
                        correctedJson << c << '\n';
                        indentLevel++;
                        for (int j = 0; j < indentLevel * 4; j++) {
                            correctedJson << ' ';
                        }
                    }
                    break;

                case '}':
                case ']':
                    correctedJson << '\n';
                    indentLevel--;
                    for (int j = 0; j < indentLevel * 4; j++) {
                        correctedJson << ' ';
                    }
                    correctedJson << c;

                    if (i + 1 < originalContent.length()) {
                        size_t nextNonSpace = i + 1;
                        while (nextNonSpace < originalContent.length() && std::isspace(static_cast<unsigned char>(originalContent[nextNonSpace]))) {
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
                    break;

                default:
                    correctedJson << c;
                    break;
            }
        }

        std::string correctedContent = correctedJson.str();

        std::vector<std::string> finalLines;
        std::stringstream finalSS(correctedContent);
        std::string finalLine;

        while (std::getline(finalSS, finalLine)) {
            while (!finalLine.empty() && finalLine.back() == ' ') {
                finalLine.pop_back();
            }
            finalLines.push_back(finalLine);
        }

        std::ostringstream finalJson;
        for (size_t i = 0; i < finalLines.size(); i++) {
            finalJson << finalLines[i];
            if (i < finalLines.size() - 1) {
                finalJson << '\n';
            }
        }

        std::string finalContent = finalJson.str();

        fs::path tempPath = jsonPath;
        tempPath.replace_extension(".indent_corrected.tmp");

        std::ofstream tempFile(tempPath, std::ios::out | std::ios::trunc | std::ios::binary);
        if (!tempFile.is_open()) {
            logFile << "ERROR: Could not create temporary file for indentation correction" << std::endl;
            return false;
        }

        tempFile << finalContent;
        tempFile.close();

        if (tempFile.fail()) {
            logFile << "ERROR: Failed to write corrected JSON to temporary file" << std::endl;
            return false;
        }

        if (!PerformTripleValidation(tempPath, fs::path(), logFile)) {
            logFile << "ERROR: Corrected JSON failed integrity check" << std::endl;
            MoveCorruptedJsonToAnalysis(tempPath, analysisDir, logFile);
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

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

        if (PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON indentation corrected successfully" << std::endl;
            logFile << " Applied perfect 4-space hierarchy with inline empty containers (including multi-line empty "
                       "detection)"
                    << std::endl;
            logFile << std::endl;
            return true;
        } else {
            logFile << "ERROR: Final corrected JSON failed integrity check" << std::endl;
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

// ===== JSON PARSING FUNCTIONS =====

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
                    while (checkPos > 0 && str[checkPos] == '\\') {
                        backslashCount++;
                        checkPos--;
                    }
                    if (backslashCount % 2 == 0) break;
                }
                ++pos;
            }

            if (pos >= len) break;

            std::string plugin = content.substr(keyStart, pos - keyStart);
            ++pos;

            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len || str[pos] != ':') {
                ++pos;
                continue;
            }

            ++pos;
            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len || str[pos] != '[') {
                ++pos;
                continue;
            }

            ++pos;

            std::vector<std::string> presets;
            presets.reserve(50);
            size_t presetIter = 0;

            while (pos < len && presetIter++ < maxIters) {
                while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
                if (pos >= len) break;

                if (str[pos] == ']') {
                    ++pos;
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
                        while (checkPos > 0 && str[checkPos] == '\\') {
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
                ++pos;

                while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
                if (pos < len && str[pos] == ',') {
                    ++pos;
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
    }

    return result;
}

std::vector<std::string> parseArray(const std::string& content) {
    std::vector<std::string> result;
    if (content.empty()) return result;

    const char* str = content.c_str();
    size_t len = content.length();
    size_t pos = 0;
    const size_t maxIters = 100000;
    size_t iter = 0;

    result.reserve(100);

    try {
        while (pos < len && iter++ < maxIters) {
            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos >= len) break;

            if (str[pos] == ']') break;

            if (str[pos] != '"') {
                ++pos;
                continue;
            }

            size_t valueStart = pos + 1;
            ++pos;

            while (pos < len) {
                if (str[pos] == '"') {
                    size_t backslashCount = 0;
                    size_t checkPos = pos - 1;
                    while (checkPos > 0 && str[checkPos] == '\\') {
                        backslashCount++;
                        checkPos--;
                    }
                    if (backslashCount % 2 == 0) break;
                }
                ++pos;
            }

            if (pos >= len) break;

            std::string value = content.substr(valueStart, pos - valueStart);
            result.push_back(std::move(value));
            ++pos;

            while (pos < len && std::isspace(static_cast<unsigned char>(str[pos]))) ++pos;
            if (pos < len && str[pos] == ',') ++pos;
        }
    } catch (...) {
    }

    return result;
}

bool parseBooleanValue(const std::string& content) {
    std::string trimmed = Trim(content);
    std::transform(trimmed.begin(), trimmed.end(), trimmed.begin(), ::tolower);
    return (trimmed == "true");
}

// ===== JSON PRESERVE AND UPDATE FUNCTIONS =====

std::string PreserveOriginalSections(const std::string& originalJson,
                                      const std::map<std::string, OrderedPluginData>& processedData,
                                      bool currentBlacklistedPresetsShowValue,
                                      bool newBlacklistedPresetsShowValue,
                                      std::ofstream& logFile) {
    try {
        const std::set<std::string> validKeys = {"npcFormID",       "npc",           "factionFemale", "factionMale",
                                                  "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        const std::set<std::string> arrayKeys = {"blacklistedPresetsFromRandomDistribution", "blacklistedNpcs",
                                                  "blacklistedNpcsPluginFemale", "blacklistedNpcsPluginMale",
                                                  "blacklistedRacesFemale", "blacklistedRacesMale",
                                                  "blacklistedOutfitsFromORefit", "blacklistedOutfitsFromORefitPlugin",
                                                  "outfitsForceRefit"};

        std::string result = originalJson;

        for (const auto& [key, data] : processedData) {
            if (validKeys.count(key) && !data.orderedData.empty()) {
                std::string keyPattern = "\"" + key + "\"";
                size_t keyPos = result.find(keyPattern);

                if (keyPos != std::string::npos) {
                    size_t colonPos = result.find(":", keyPos);
                    if (colonPos != std::string::npos) {
                        size_t valueStart = colonPos + 1;

                        while (valueStart < result.length() && std::isspace(static_cast<unsigned char>(result[valueStart]))) {
                            valueStart++;
                        }

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

                            std::ostringstream newValue;
                            newValue << "{\n";

                            bool first = true;
                            for (const auto& [plugin, presets] : data.orderedData) {
                                if (!first) newValue << ",\n";
                                first = false;

                                newValue << "        \"" << EscapeJson(plugin) << "\": [\n";

                                bool firstPreset = true;
                                for (const auto& preset : presets) {
                                    if (!firstPreset) newValue << ",\n";
                                    firstPreset = false;

                                    newValue << "            \"" << EscapeJson(preset) << "\"";
                                }

                                newValue << "\n        ]";
                            }

                            newValue << "\n    }";

                            result.replace(valueStart, valueEnd - valueStart, newValue.str());
                            logFile << "INFO: Successfully updated key '" << key << "' with proper 4-space indentation"
                                    << std::endl;
                        }
                    }
                }
            } else if (arrayKeys.count(key) && !data.orderedData.empty()) {
                std::string keyPattern = "\"" + key + "\"";
                size_t keyPos = result.find(keyPattern);

                if (keyPos != std::string::npos) {
                    size_t colonPos = result.find(":", keyPos);
                    if (colonPos != std::string::npos) {
                        size_t valueStart = colonPos + 1;

                        while (valueStart < result.length() && std::isspace(static_cast<unsigned char>(result[valueStart]))) {
                            valueStart++;
                        }

                        size_t valueEnd = valueStart;
                        if (valueStart < result.length() && result[valueStart] == '[') {
                            int bracketCount = 1;
                            valueEnd = valueStart + 1;
                            bool inString = false;
                            bool escape = false;

                            while (valueEnd < result.length() && bracketCount > 0) {
                                char c = result[valueEnd];

                                if (c == '"' && !escape) {
                                    inString = !inString;
                                } else if (!inString) {
                                    if (c == '[')
                                        bracketCount++;
                                    else if (c == ']')
                                        bracketCount--;
                                }

                                escape = (c == '\\' && !escape);
                                valueEnd++;
                            }

                            std::ostringstream newValue;
                            newValue << "[\n";

                            bool first = true;
                            for (const auto& [plugin, presets] : data.orderedData) {
                                for (const auto& preset : presets) {
                                    if (!first) newValue << ",\n";
                                    first = false;
                                    newValue << "        \"" << EscapeJson(preset) << "\"";
                                }
                            }

                            newValue << "\n    ]";

                            result.replace(valueStart, valueEnd - valueStart, newValue.str());
                            logFile << "INFO: Successfully updated array key '" << key
                                    << "' with proper 4-space indentation" << std::endl;
                        }
                    }
                }
            }
        }

        if (currentBlacklistedPresetsShowValue != newBlacklistedPresetsShowValue) {
            std::string keyPattern = "\"blacklistedPresetsShowInOBodyMenu\"";
            size_t keyPos = result.find(keyPattern);

            if (keyPos != std::string::npos) {
                size_t colonPos = result.find(":", keyPos);
                if (colonPos != std::string::npos) {
                    size_t valueStart = colonPos + 1;

                    while (valueStart < result.length() && std::isspace(static_cast<unsigned char>(result[valueStart]))) {
                        valueStart++;
                    }

                    size_t valueEnd = valueStart;
                    while (valueEnd < result.length() && 
                           (std::isalpha(static_cast<unsigned char>(result[valueEnd])) || result[valueEnd] == '_')) {
                        valueEnd++;
                    }

                    std::string newBoolValue = newBlacklistedPresetsShowValue ? "true" : "false";
                    result.replace(valueStart, valueEnd - valueStart, newBoolValue);
                    logFile << "INFO: Updated blacklistedPresetsShowInOBodyMenu to " << newBoolValue << std::endl;
                }
            }
        }

        return result;
    } catch (const std::exception& e) {
        logFile << "ERROR in PreserveOriginalSections: " << e.what() << std::endl;
        return originalJson;
    } catch (...) {
        logFile << "ERROR in PreserveOriginalSections: Unknown exception" << std::endl;
        return originalJson;
    }
}

bool CheckIfChangesNeeded(const std::string& originalJson,
                         const std::map<std::string, OrderedPluginData>& processedData,
                         bool currentBlacklistedPresetsShowValue,
                         bool newBlacklistedPresetsShowValue) {
    const std::vector<std::string> validKeys = {"npcFormID", "npc", "factionFemale", "factionMale",
                                                "npcPluginFemale", "npcPluginMale", "raceFemale", "raceMale"};

    const std::vector<std::string> arrayKeys = {"blacklistedPresetsFromRandomDistribution", "blacklistedNpcs",
                                                "blacklistedNpcsPluginFemale", "blacklistedNpcsPluginMale",
                                                "blacklistedRacesFemale", "blacklistedRacesMale",
                                                "blacklistedOutfitsFromORefit", "blacklistedOutfitsFromORefitPlugin",
                                                "outfitsForceRefit"};

    if (currentBlacklistedPresetsShowValue != newBlacklistedPresetsShowValue) {
        return true;
    }

    for (const auto& key : validKeys) {
        auto it = processedData.find(key);
        if (it != processedData.end() && !it->second.orderedData.empty()) {
            return true;
        }
    }

    for (const auto& key : arrayKeys) {
        auto it = processedData.find(key);
        if (it != processedData.end() && !it->second.orderedData.empty()) {
            return true;
        }
    }

    return false;
}

std::tuple<bool, std::string, bool> ReadCompleteJson(const fs::path& jsonPath,
                                                      std::map<std::string, OrderedPluginData>& processedData,
                                                      std::ofstream& logFile) {
    try {
        if (!fs::exists(jsonPath)) {
            logFile << "ERROR: JSON file does not exist at: " << jsonPath.string() << std::endl;
            return {false, "", true};
        }

        if (!PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "ERROR: JSON integrity check failed" << std::endl;
            return {false, "", true};
        }

        logFile << "Reading existing JSON from: " << jsonPath.string() << std::endl;

        std::string jsonContent = ReadFileWithEncoding(jsonPath);

        if (jsonContent.empty() || jsonContent.size() < 2) {
            logFile << "ERROR: JSON file is empty or too small after reading" << std::endl;
            return {false, "", true};
        }

        const std::vector<std::string> validKeys = {"npcFormID",       "npc",           "factionFemale", "factionMale",
                                                    "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

        const std::vector<std::string> arrayKeys = {"blacklistedPresetsFromRandomDistribution", "blacklistedNpcs",
                                                     "blacklistedNpcsFormID", "blacklistedNpcsPluginFemale",
                                                     "blacklistedNpcsPluginMale", "blacklistedRacesFemale",
                                                     "blacklistedRacesMale", "blacklistedOutfitsFromORefitFormID",
                                                     "blacklistedOutfitsFromORefit", "blacklistedOutfitsFromORefitPlugin",
                                                     "outfitsForceRefitFormID", "outfitsForceRefit"};

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

        for (const auto& key : arrayKeys) {
            processedData[key] = OrderedPluginData();

            size_t keyPos = jsonContent.find("\"" + key + "\"");
            if (keyPos != std::string::npos) {
                size_t colonPos = jsonContent.find(":", keyPos);
                if (colonPos != std::string::npos) {
                    size_t openBracket = jsonContent.find("[", colonPos);
                    if (openBracket != std::string::npos) {
                        int bracketCount = 1;
                        size_t pos = openBracket + 1;
                        size_t closeBracket = std::string::npos;
                        bool inString = false;
                        bool escape = false;

                        while (pos < jsonContent.length() && bracketCount > 0) {
                            char c = jsonContent[pos];

                            if (c == '"' && !escape) {
                                inString = !inString;
                            } else if (!inString) {
                                if (c == '[') {
                                    bracketCount++;
                                } else if (c == ']') {
                                    bracketCount--;
                                    if (bracketCount == 0) {
                                        closeBracket = pos;
                                        break;
                                    }
                                }
                            }

                            escape = (c == '\\' && !escape);
                            pos++;
                        }

                        if (closeBracket != std::string::npos) {
                            std::string keyContent = jsonContent.substr(openBracket + 1, closeBracket - openBracket - 1);
                            auto arrayValues = parseArray(keyContent);

                            for (const auto& value : arrayValues) {
                                processedData[key].addPreset("", value);
                            }
                        }
                    }
                }
            }
        }

        bool blacklistedPresetsShowValue = true;
        std::string boolKey = "\"blacklistedPresetsShowInOBodyMenu\"";
        size_t boolKeyPos = jsonContent.find(boolKey);
        if (boolKeyPos != std::string::npos) {
            size_t colonPos = jsonContent.find(":", boolKeyPos);
            if (colonPos != std::string::npos) {
                size_t valueStart = colonPos + 1;
                while (valueStart < jsonContent.length() && std::isspace(static_cast<unsigned char>(jsonContent[valueStart]))) {
                    valueStart++;
                }

                size_t valueEnd = valueStart;
                while (valueEnd < jsonContent.length() && 
                       (std::isalpha(static_cast<unsigned char>(jsonContent[valueEnd])) || jsonContent[valueEnd] == '_')) {
                    valueEnd++;
                }

                std::string boolValue = jsonContent.substr(valueStart, valueEnd - valueStart);
                blacklistedPresetsShowValue = parseBooleanValue(boolValue);
                logFile << "Read blacklistedPresetsShowInOBodyMenu: " << (blacklistedPresetsShowValue ? "true" : "false") << std::endl;
            }
        }

        logFile << "Loaded existing data from JSON:" << std::endl;
        for (const auto& [key, data] : processedData) {
            size_t count = data.getTotalPresetCount();
            if (count > 0) {
                logFile << "  " << key << ": " << data.getPluginCount() << " plugins, " << count << " presets"
                        << std::endl;
            }
        }
        logFile << std::endl;

        return {true, jsonContent, blacklistedPresetsShowValue};
    } catch (const std::exception& e) {
        logFile << "ERROR in ReadCompleteJson: " << e.what() << std::endl;
        return {false, "", true};
    } catch (...) {
        logFile << "ERROR in ReadCompleteJson: Unknown exception occurred" << std::endl;
        return {false, "", true};
    }
}

bool WriteJsonAtomically(const fs::path& jsonPath, const std::string& content, const fs::path& analysisDir,
                         std::ofstream& logFile) {
    try {
        fs::path tempPath = jsonPath;
        tempPath.replace_extension(".tmp");

        std::ofstream tempFile(tempPath, std::ios::out | std::ios::trunc | std::ios::binary);
        if (!tempFile.is_open()) {
            logFile << "ERROR: Could not create temporary JSON file" << std::endl;
            return false;
        }

        tempFile << content;
        tempFile.close();

        if (tempFile.fail()) {
            logFile << "ERROR: Failed to write to temporary JSON file" << std::endl;
            return false;
        }

        if (!PerformTripleValidation(tempPath, fs::path(), logFile)) {
            logFile << "ERROR: Temporary JSON file failed integrity check" << std::endl;
            MoveCorruptedJsonToAnalysis(tempPath, analysisDir, logFile);
            try {
                fs::remove(tempPath);
            } catch (...) {
            }
            return false;
        }

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

        if (PerformTripleValidation(jsonPath, fs::path(), logFile)) {
            logFile << "SUCCESS: JSON file written atomically and verified" << std::endl;
            return true;
        } else {
            logFile << "ERROR: Final JSON file failed integrity check" << std::endl;
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
        std::string content = ReadFileWithEncoding(iniPath);
        if (content.empty()) return;

        std::stringstream ss(content);
        std::vector<std::string> lines;
        std::string line;
        lines.reserve(200);

        while (std::getline(ss, line)) {
            lines.push_back(line);
        }

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

        std::ofstream outFile(iniPath, std::ios::out | std::ios::trunc);
        if (outFile.is_open()) {
            for (const auto& outputLine : lines) {
                outFile << outputLine << std::endl;
            }
            outFile.close();
        }

    } catch (...) {
    }
}

// ===== MAIN PLUGIN FUNCTION =====

extern "C" __declspec(dllexport) bool SKSEPlugin_Load(const SKSE::LoadInterface* skse) {
    try {
        SKSE::Init(skse);

        SKSE::GetMessagingInterface()->RegisterListener([](SKSE::MessagingInterface::Message* message) {
            try {
                if (message->type == SKSE::MessagingInterface::kDataLoaded) {
                    std::string documentsPath;
                    std::string gamePath;

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
                    logFile << "OBody NG Preset Distribution Assistant NG v" << PLUGIN_VERSION << std::endl;
                    logFile << "Log created on: " << std::put_time(&buf, "%Y-%m-%d %H:%M:%S") << std::endl;
                    logFile << "====================================================" << std::endl << std::endl;

                    fs::path configIniPath = sksePluginsPath / "OBody_NG_Preset_Distribution_Assistant_NG.ini";
                    fs::path jsonOutputPath = sksePluginsPath / "OBody_presetDistributionConfig.json";
                    fs::path backupJsonPath =
                        sksePluginsPath / "Backup_OBody_DPA" / "OBody_presetDistributionConfig.json";
                    fs::path analysisDir = sksePluginsPath / "Backup_OBody_DPA" / "Analysis";
                    fs::path bodySlidePresetsPath = dataPath / "CalienteTools" / "BodySlide" / "SliderPresets";

                    logFile << "Reading configuration..." << std::endl;
                    logFile << "----------------------------------------------------" << std::endl;
                    ConfigSettings config = ReadConfigFromIni(configIniPath, logFile);

                    logFile << std::endl;
                    if (!PerformSimpleJsonIntegrityCheck(jsonOutputPath, logFile)) {
                        logFile << std::endl;
                        logFile << "CRITICAL: JSON failed simple integrity check at startup - Attempting to restore "
                                   "from backup..."
                                << std::endl;

                        if (RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup. Proceeding with the normal process."
                                    << std::endl;
                        } else {
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
                                "CRITICAL ERROR: OBody JSON is corrupted and could not be restored - Check the log file "
                                "for details.");
                            return;
                        }
                    }

                    logFile << "JSON passed initial integrity check or was restored - proceeding with normal process..."
                            << std::endl;
                    logFile << std::endl;

                    const std::set<std::string> validKeys = {
                        "npcFormID",       "npc",           "factionFemale", "factionMale",
                        "npcPluginFemale", "npcPluginMale", "raceFemale",    "raceMale"};

                    std::map<std::string, OrderedPluginData> processedData;
                    for (const auto& key : validKeys) {
                        processedData[key] = OrderedPluginData();
                    }
                    processedData["blacklistedPresetsFromRandomDistribution"] = OrderedPluginData();
                    processedData["blacklistedNpcs"] = OrderedPluginData();
                    processedData["blacklistedNpcsFormID"] = OrderedPluginData();
                    processedData["blacklistedNpcsPluginFemale"] = OrderedPluginData();
                    processedData["blacklistedNpcsPluginMale"] = OrderedPluginData();
                    processedData["blacklistedRacesFemale"] = OrderedPluginData();
                    processedData["blacklistedRacesMale"] = OrderedPluginData();
                    processedData["blacklistedOutfitsFromORefitFormID"] = OrderedPluginData();
                    processedData["blacklistedOutfitsFromORefit"] = OrderedPluginData();
                    processedData["blacklistedOutfitsFromORefitPlugin"] = OrderedPluginData();
                    processedData["outfitsForceRefitFormID"] = OrderedPluginData();
                    processedData["outfitsForceRefit"] = OrderedPluginData();

                    bool backupPerformed = false;

                    if (config.backupValue == 1 || config.backupValue == 2) {
                        if (config.backupValue == 2) {
                            logFile << "Backup enabled (Backup = true), performing LITERAL backup always..."
                                    << std::endl;
                        } else {
                            logFile << "Backup enabled (Backup = 1), performing LITERAL backup..." << std::endl;
                        }

                        if (PerformLiteralJsonBackup(jsonOutputPath, backupJsonPath, logFile)) {
                            backupPerformed = true;
                            if (config.backupValue != 2) {
                                UpdateBackupConfigInIni(configIniPath, logFile, config.backupValue);
                            }
                        } else {
                            logFile << "ERROR: LITERAL backup failed, continuing with normal process..." << std::endl;
                        }

                    } else {
                        logFile << "Backup disabled (Backup = 0), skipping backup" << std::endl;
                    }

                    logFile << std::endl;

                    auto [readSuccess, originalJsonContent, currentBlacklistedPresetsShow] = 
                        ReadCompleteJson(jsonOutputPath, processedData, logFile);

                    if (!readSuccess) {
                        logFile << "JSON read failed, attempting to restore from backup..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "Backup restoration successful, retrying JSON read..." << std::endl;
                            auto retryResult = ReadCompleteJson(jsonOutputPath, processedData, logFile);
                            readSuccess = std::get<0>(retryResult);
                            originalJsonContent = std::get<1>(retryResult);
                            currentBlacklistedPresetsShow = std::get<2>(retryResult);
                        }

                        if (!readSuccess) {
                            logFile
                                << "Process truncated due to JSON read error. No INI processing or updates performed."
                                << std::endl;
                            logFile << "====================================================" << std::endl;
                            logFile.close();

                            RE::ConsoleLog::GetSingleton()->Print(
                                "ERROR: JSON READ FAILED - CONTACT MODDER OR REINSTALL");
                            return;
                        } else {
                            logFile << "JSON read successful after restoration" << std::endl;
                        }
                    }

                    fs::path logDoctorPath = fs::path(documentsPath) / "My Games" / "Skyrim Special Edition" / "SKSE" /
                                             "OBody_NG_Preset_Distribution_Assistant-NG_Doctor.log";
                    GenerateDoctorLog(bodySlidePresetsPath, logDoctorPath, logFile);

                    PresetMapData presetMapForCleaning = BuildPresetNameMap(bodySlidePresetsPath, logFile);

                    fs::path logSmartCleaningPath = fs::path(documentsPath) / "My Games" / "Skyrim Special Edition" / "SKSE" /
                                                    "OBody_NG_Preset_Distribution_Assistant-NG_Smart_Cleaning.log";
                    GenerateSmartCleaningLog(presetMapForCleaning, logSmartCleaningPath, logFile);

                    fs::path logHelperPath = fs::path(documentsPath) / "My Games" / "Skyrim Special Edition" / "SKSE" /
                                             "OBody_NG_Preset_Distribution_Assistant-NG_List-Helper.log";
                    PresetMapData presetMapForHelper = BuildPresetNameMap(bodySlidePresetsPath, logFile);
                    GenerateHelperLog(presetMapForHelper, logHelperPath, logFile);

                    int totalRulesProcessed = 0;
                    int totalRulesApplied = 0;
                    int totalRulesSkipped = 0;
                    int totalPresetsRemoved = 0;
                    int totalPluginsRemoved = 0;
                    int totalFilesProcessed = 0;

                    logFile << "Scanning for OBodyNG_PDA_*.ini files..." << std::endl;
                    logFile << "----------------------------------------------------" << std::endl;

                    try {
                        for (const auto& entry : fs::directory_iterator(dataPath)) {
                            if (entry.is_regular_file()) {
                                std::string filename = entry.path().filename().string();
                                if (StartsWith(filename, "OBodyNG_PDA_") && EndsWith(filename, ".ini")) {
                                    logFile << std::endl << "Processing file: " << filename << std::endl;
                                    totalFilesProcessed++;

                                    std::string iniContent = ReadFileWithEncoding(entry.path());
                                    if (iniContent.empty()) {
                                        logFile << "  ERROR: Could not read file" << std::endl;
                                        continue;
                                    }

                                    std::stringstream iniStream(iniContent);
                                    std::vector<std::pair<std::string, ParsedRule>> fileLinesAndRules;
                                    std::string line;
                                    int rulesInFile = 0;
                                    int rulesAppliedInFile = 0;
                                    int rulesSkippedInFile = 0;
                                    int presetsRemovedInFile = 0;
                                    int pluginsRemovedInFile = 0;
                                    fileLinesAndRules.reserve(100);

                                    while (std::getline(iniStream, line)) {
                                        std::string originalLine = line;

                                        size_t commentPos = line.find(';');
                                        if (commentPos != std::string::npos) {
                                            line = line.substr(0, commentPos);
                                        }

                                        commentPos = line.find('#');
                                        if (commentPos != std::string::npos) {
                                            line = line.substr(0, commentPos);
                                        }

                                        size_t equalPos = line.find('=');
                                        if (equalPos != std::string::npos) {
                                            std::string key = Trim(line.substr(0, equalPos));
                                            std::string value = Trim(line.substr(equalPos + 1));

                                            if (validKeys.count(key) && !value.empty()) {
                                                ParsedRule rule = ParseRuleLine(key, value);

                                                if (!rule.plugin.empty() && !rule.presets.empty()) {
                                                    rulesInFile++;
                                                    totalRulesProcessed++;

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

                                                        if (needsUpdate) {
                                                            rule.applyCount = newCount;
                                                            fileLinesAndRules.emplace_back(originalLine, rule);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }

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

                    std::vector<std::string> missingPresetsFromIni;
                    PerformSmartCleaning(processedData, config, bodySlidePresetsPath, logFile, missingPresetsFromIni);

                    auto [allPresetsForBlacklist, presetsForRaces] = ProcessUBEXmlPresets(bodySlidePresetsPath, logFile);
                    bool ubeChangesApplied = ApplyUBEPresetsToJson(processedData, allPresetsForBlacklist, presetsForRaces, logFile);

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
                    logFile << "UBE XML presets found: " << allPresetsForBlacklist.size() << std::endl;
                    logFile << "UBE presets added to races: " << presetsForRaces.size() << std::endl;
                    logFile << "UBE changes applied: " << (ubeChangesApplied ? "YES" : "NO") << std::endl;
                    logFile << "Smart Cleaning enabled (any): " << ((config.presetsSmartCleaning || config.blacklistedPresetsSmartCleaningFromRandomDistribution || config.blacklistedPresetsSmartCleaningFromAll || config.outfitsForceReSmartCleaning) ? "YES" : "NO") << std::endl;
                    logFile << "Current blacklistedPresetsShowInOBodyMenu: " << (currentBlacklistedPresetsShow ? "true" : "false") << std::endl;
                    logFile << "Target blacklistedPresetsShowInOBodyMenu (ModeUBE): " << (config.modeUBE ? "true" : "false") << std::endl;
                    logFile << std::endl << "Final data in JSON:" << std::endl;

                    for (const auto& [key, data] : processedData) {
                        size_t count = data.getTotalPresetCount();
                        if (count > 0) {
                            logFile << "  " << key << ": " << data.getPluginCount() << " plugins, " << count
                                    << " total presets" << std::endl;
                        }
                    }

                    logFile << "====================================================" << std::endl << std::endl;

                    logFile << "Updating JSON at: " << jsonOutputPath.string() << std::endl;

                    try {
                        std::string updatedJsonContent =
                            PreserveOriginalSections(originalJsonContent, processedData, 
                                                    currentBlacklistedPresetsShow, config.modeUBE, logFile);

                        if (CheckIfChangesNeeded(originalJsonContent, processedData, 
                                                currentBlacklistedPresetsShow, config.modeUBE)) {
                            logFile << "Changes detected (INI rules, UBE XML, Smart Cleaning, or ModeUBE). Proceeding with atomic write..." << std::endl;

                            if (WriteJsonAtomically(jsonOutputPath, updatedJsonContent, analysisDir, logFile)) {
                                logFile << "SUCCESS: JSON updated successfully with proper 4-space indentation hierarchy"
                                        << std::endl;

                                logFile << std::endl;
                                if (CorrectJsonIndentation(jsonOutputPath, analysisDir, logFile)) {
                                    logFile << "SUCCESS: JSON indentation verification and correction completed"
                                            << std::endl;
                                } else {
                                    logFile << "ERROR: JSON indentation correction failed" << std::endl;
                                    logFile << "Attempting to restore from backup due to indentation failure..."
                                            << std::endl;
                                    if (fs::exists(backupJsonPath) &&
                                        RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                                        logFile << "SUCCESS: JSON restored from backup after indentation failure"
                                                << std::endl;
                                    } else {
                                        logFile << "CRITICAL ERROR: Could not restore JSON from backup" << std::endl;
                                    }
                                }
                            } else {
                                logFile << "ERROR: Failed to write JSON safely" << std::endl;
                                logFile << "Attempting to restore from backup due to write failure..." << std::endl;
                                if (fs::exists(backupJsonPath) &&
                                    RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                                    logFile << "SUCCESS: JSON restored from backup after write failure" << std::endl;
                                } else {
                                    logFile << "CRITICAL ERROR: Could not restore JSON from backup" << std::endl;
                                }
                            }
                        } else {
                            logFile << "No changes detected. Skipping redundant atomic write." << std::endl;

                            if (CorrectJsonIndentation(jsonOutputPath, analysisDir, logFile)) {
                                logFile << "JSON indentation is already perfect or has been corrected." << std::endl;
                            } else {
                                logFile << "ERROR: JSON indentation correction failed" << std::endl;
                                logFile << "Attempting to restore from backup due to indentation failure..."
                                        << std::endl;
                                if (fs::exists(backupJsonPath) &&
                                    RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                                    logFile << "SUCCESS: JSON restored from backup after indentation failure"
                                            << std::endl;
                                } else {
                                    logFile << "CRITICAL ERROR: Could not restore JSON from backup" << std::endl;
                                }
                            }
                        }

                    } catch (const std::exception& e) {
                        logFile << "ERROR in JSON update process: " << e.what() << std::endl;
                        logFile << "Attempting to restore from backup due to update failure..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup after update failure" << std::endl;
                        } else {
                            logFile << "CRITICAL ERROR: Could not restore JSON from backup" << std::endl;
                        }

                    } catch (...) {
                        logFile << "ERROR in JSON update process: Unknown exception" << std::endl;
                        logFile << "Attempting to restore from backup due to unknown failure..." << std::endl;
                        if (fs::exists(backupJsonPath) &&
                            RestoreJsonFromBackup(backupJsonPath, jsonOutputPath, analysisDir, logFile)) {
                            logFile << "SUCCESS: JSON restored from backup after unknown failure" << std::endl;
                        } else {
                            logFile << "CRITICAL ERROR: Could not restore JSON from backup" << std::endl;
                        }
                    }

                    logFile << std::endl
                            << "Process completed successfully with perfect 4-space JSON formatting."
                            << std::endl;
                    logFile.close();

                    RE::ConsoleLog::GetSingleton()->Print("OBody Assistant: Process completed successfully");
                }

            } catch (const std::exception& e) {
                RE::ConsoleLog::GetSingleton()->Print("ERROR in OBody Assistant main process");
            } catch (...) {
                RE::ConsoleLog::GetSingleton()->Print("CRITICAL ERROR in OBody Assistant");
            }
        });

        return true;
    } catch (const std::exception& e) {
        RE::ConsoleLog::GetSingleton()->Print("ERROR loading OBody Assistant plugin");
        return false;
    } catch (...) {
        RE::ConsoleLog::GetSingleton()->Print("CRITICAL ERROR loading OBody Assistant plugin");
        return false;
    }
}