const KEY_ORDER = [
  'npcFormID',
  'npc',
  'factionFemale',
  'factionMale',
  'npcPluginFemale',
  'npcPluginMale',
  'raceFemale',
  'raceMale',
  'blacklistedNpcs',
  'blacklistedNpcsFormID',
  'blacklistedNpcsPluginFemale',
  'blacklistedNpcsPluginMale',
  'blacklistedRacesFemale',
  'blacklistedRacesMale',
  'blacklistedOutfitsFromORefitFormID',
  'blacklistedOutfitsFromORefit',
  'blacklistedOutfitsFromORefitPlugin',
  'outfitsForceRefitFormID',
  'outfitsForceRefit',
  'blacklistedPresetsFromRandomDistribution',
  'blacklistedPresetsShowInOBodyMenu'
];

const SAMPLE_JSON = {};

const KEY_EXPLANATIONS = {
  npcFormID:
    'This is the first rule, and it\'s one of the first that OBody NG reads to apply. <span class="cat-highlight">I personally don\'t recommend it, since it\'s somewhat complicated to add the correct elements and it\'s prone to fail due to how strict it is with ID order (I\'m working on a support system to auto-correct the ID order personalized for each player, I\'ll let you know when it\'s ready).</span> The approach of this rule is to first place the full name of the plugin the NPC belongs to, followed by the FormID, you can obtain this with the PDA MCM, SSEEdit or in the game itself. Then you place the list of presets, it can be one or multiple, chosen from the set of presets you include in it.',
  npc:
    'This is the second rule that OBody reads to apply presets. <span class="cat-highlight">This one focuses on applying the NPC\'s name, yes, the name, not the ID, and this name has to be correctly written.</span> For people who play in other languages like Cyrillic, Korean, or other of the <span class="cat-highlight-orange">8 official languages and the unofficial ones</span>, where NPC names are affected by translations, you will have to take that into account. A player had problems because the NPC rule didn\'t work for him, and it was because he used, for example, "<span class="cat-highlight-orange">Serana</span>" and his game was in Cyrillic internally, so the game processes the names as "<span class="cat-highlight-orange">Серана</span>", which is Serana in Cyrillic, and that\'s how it worked. <span class="cat-highlight">Serana is almost the same in all other languages, but in Chinese it changes to "<span class="cat-highlight-orange">瑟拉娜</span>".</span> <span class="cat-highlight">The PDA program is capable of detecting these names.</span> I\'ll create a generic auto-correction library in case of some names, but that will be for next year. <span class="cat-highlight">This requires the full name of the NPC and the presets you decide to apply to it.</span> I recommend using this if you know very well what names the NPCs have and that they haven\'t been modified by languages.',
  factionFemale:
    'Third key that OBody reads. <span class="cat-highlight">The number of factions in the game is ridiculously high; creating a complete list would be very tedious, and there are easily more than 1k.</span> So you can use or search online which faction belongs to which NPC (including in the 🔍 Dynamic Info Extractor NPC Range a display of factions each NPC around belongs to, that can help create rules), and save city NPCs or more, including mod factions. <span class="cat-highlight">It requires the faction name, not the ID, and then the presets you want to apply.</span> This is the same for female and male. I don\'t recommend it much, but it is functional.',
  factionMale:
    'Third key that OBody reads. <span class="cat-highlight">The number of factions in the game is ridiculously high; creating a complete list would be very tedious, and there are easily more than 1k.</span> So you can use or search online which faction belongs to which NPC (including in the 🔍 Dynamic Info Extractor NPC Range a display of factions each NPC around belongs to, that can help create rules), and save city NPCs or more, including mod factions. <span class="cat-highlight">It requires the faction name, not the ID, and then the presets you want to apply.</span> This is the same for female and male. I don\'t recommend it much, but it is functional.',
  npcPluginFemale:
    '<span class="cat-highlight">My favorite, and the one I use the most when dealing with mod NPCs. This is the best option.</span> First, it is very unlikely for an NPC associated with a plugin to have plugin name variation; the plugin names are always static, so it is a solid way to associate a preset to an NPC: you put the plugin name and directly apply which preset you want to use on the NPCs within that plugin.',
  npcPluginMale:
    '<span class="cat-highlight">My favorite, and the one I use the most when dealing with mod NPCs. This is the best option.</span> First, it is very unlikely for an NPC associated with a plugin to have plugin name variation; the plugin names are always static, so it is a solid way to associate a preset to an NPC: you put the plugin name and directly apply which preset you want to use on the NPCs within that plugin.',
  raceFemale:
    '<span class="cat-highlight">Another of my favorites: races.</span> There are the common races, the UBE races, and of course the customizable races. In these rules the list is already there, but you can write whichever you like in the PDA. <span class="cat-highlight">The system can read what race each NPC added to favorites is, and will vary according to which they belong to.</span> It is very rare for this to be affected by translations. In this case, these keys require the race to which they will apply the set of presets, and using a range from one to multiple preset sets; <span class="cat-highlight">don\'t limit yourself to just one, make a closed selection set.</span>',
  raceMale:
    '<span class="cat-highlight">Another of my favorites: races.</span> There are the common races, the UBE races, and of course the customizable races. In these rules the list is already there, but you can write whichever you like in the PDA. <span class="cat-highlight">The system can read what race each NPC added to favorites is, and will vary according to which they belong to.</span> It is very rare for this to be affected by translations. In this case, these keys require the race to which they will apply the set of presets, and using a range from one to multiple preset sets; <span class="cat-highlight">don\'t limit yourself to just one, make a closed selection set.</span>',
  blacklistedNpcs:
    'Here we start with what isn\'t used much, <span class="cat-highlight">if you\'re a common Skyrim user you probably won\'t need this, but if you\'re already in the modding environment you can use it.</span> OBody reads this not to apply presets, but quite the opposite, <span class="cat-highlight">it\'s to apply nothing to them.</span> Here you require the name, and you must remember the original and full name of the NPC. If it\'s in another language and you have the game in that language, put the name in that language, if it\'s from a mod, put the name that appears in the mod. It\'s simple to follow.',
  blacklistedNpcsFormID:
    'Same idea as the previous one, but using IDs. Here you can choose an NPC through the plugin it belongs to and its full ID. <span class="cat-highlight">I don\'t recommend it much due to ID fluctuation between load orders.</span> Once applied, that NPC will no longer appear in the randomization system.',
  blacklistedNpcsPluginFemale:
    'Again it consists of the plugin, but <span class="cat-highlight">this is one of the most recommended blacklist options.</span> Here you put the name of the plugin you want to ban and that\'s it, no presets will be applied to these NPCs. If you have problems you can use its counterpart in the adding system, npcPlugin. <span class="cat-highlight">There you put the plugin name followed by a single preset, usually <span class="cat-preset-name">"Without Preset PDA"</span>. I created it to apply to NPCs from CBBE/3BA/BHUNP/COtR/etc. so they stay slim by default and you can apply your preset with OBody as you like. This also applies to presets for UBE <span class="cat-preset-name">"-Zeroed Sliders-"</span> and the slim preset for HIMBO <span class="cat-preset-name">"HIMBO Default"</span>. I leave these three as default favorites.</span>',
  blacklistedNpcsPluginMale:
    'Again it consists of the plugin, but <span class="cat-highlight">this is one of the most recommended blacklist options.</span> Here you put the name of the plugin you want to ban and that\'s it, no presets will be applied to these NPCs. If you have problems you can use its counterpart in the adding system, npcPlugin. <span class="cat-highlight">There you put the plugin name followed by a single preset, usually <span class="cat-preset-name">"Without Preset PDA"</span>. I created it to apply to NPCs from CBBE/3BA/BHUNP/COtR/etc. so they stay slim by default and you can apply your preset with OBody as you like. This also applies to presets for UBE <span class="cat-preset-name">"-Zeroed Sliders-"</span> and the slim preset for HIMBO <span class="cat-preset-name">"HIMBO Default"</span>. I leave these three as default favorites.</span>',
  blacklistedRacesFemale:
    'You already know the same about races and the list, but here there’s something special… <span class="cat-highlight">these will be filled automatically with presets. Generally those for UBE.</span> This is an option I added to avoid bugs and make the work cleaner. <span class="cat-highlight">This helps prevent some bodies from becoming corrupted.</span> It’s interesting how to add presets here, but applying it above doesn’t delete or block it, rather it <span class="cat-highlight">prevents NPCs that are (CBBE/3BA/BHUNP/COtR/etc.) from accidentally being applied a UBE or HIMBO preset, and in turn it’s not an obstacle for HIMBO and UBE NPCs to have their respective presets applied, since the system I created auto-applies the set of your specific presets to those NPCs, avoiding breakage.</span> It was a long and heavy work, thanks to all the beta testers for the testing.',
  blacklistedRacesMale:
    'You already know the same about races and the list, but here there’s something special… <span class="cat-highlight">these will be filled automatically with presets. Generally those for UBE.</span> This is an option I added to avoid bugs and make the work cleaner. <span class="cat-highlight">This helps prevent some bodies from becoming corrupted.</span> It’s interesting how to add presets here, but applying it above doesn’t delete or block it, rather it <span class="cat-highlight">prevents NPCs that are (CBBE/3BA/BHUNP/COtR/etc.) from accidentally being applied a UBE or HIMBO preset, and in turn it’s not an obstacle for HIMBO and UBE NPCs to have their respective presets applied, since the system I created auto-applies the set of your specific presets to those NPCs, avoiding breakage.</span> It was a long and heavy work, thanks to all the beta testers for the testing.',
  blacklistedOutfitsFromORefitFormID:
    'Outfits… here it\'s complicated territory. <span class="cat-highlight">Here you can apply game clothing and prevent them from auto-adjusting, it\'s quite complicated to explain, so I invite you to look on Discord for a user named "Cryshy", he asked me to apply the clothing dynamics in the PDA system, he explained with images and more, but I\'m not an expert in that.</span> What I can explain here is that if for some reason an NPC is UBE and equips UBE clothing, the clothes stick too much to the body and don\'t take physics properly. <span class="cat-highlight">This helps with that.</span> All outfit rules are like this, you can add or remove. In particular, this first one is to leave clothes out of OBody\'s refit, leaving the clothing physics as is, and this is achieved with the plugin name and the equipment ID.',
  blacklistedOutfitsFromORefit:
    '<span class="cat-highlight">Here it\'s easier: just place the name of the outfit for those you don\'t want to have a refit done on. That simple.</span> So when an NPC puts on the clothing, it won\'t stick to the body but will take the body\'s physics, or something like that. As I already told you, this section is not my specialty because I don\'t use UBE at the moment; I lack money for a better hard drive 😹.',
  blacklistedOutfitsFromORefitPlugin:
    '<span class="cat-highlight">The same but with clothing plugin name, ok. Plugins that contain clothing, not NPCs, but clothing.</span>',
  outfitsForceRefitFormID:
    'And here the opposite, <span class="cat-highlight">this one does do a refit. As I mentioned I\'m not an expert, so I invite you to try it or ask some from the UBE photographer, they know more.</span> I haven\'t installed UBE on my PC yet because I have no memory left, and with how expensive it is, it\'ll be for next year, hahahah. Here they require the plugin name and the exact ID of the armor set. <span class="cat-highlight">I\'ll also work on this to improve it in the automatic ID correction system, to avoid errors, in the future.</span>',
  outfitsForceRefit:
    'And here you have to put <span class="cat-highlight">the name of the equipment</span> in the language it is in, ok. Complete.',
  blacklistedPresetsFromRandomDistribution:
    'This is <span class="cat-highlight">one of the special ones.</span> Before the PDA existed, you had to manually place all presets that were for UBE or HIMBO here to avoid errors. <span class="cat-highlight">Now the mod does this automatically, so I recommend not touching it, except to add presets you personally consider necessary; it is already self-sufficient now.</span>',
  blacklistedPresetsShowInOBodyMenu:
    'Here this value can be true or false, but <span class="cat-highlight">the PDA mod auto-adjusts it to true.</span> Essentially, this will <span class="cat-highlight">make all previous presets that are on the blacklist visible in the game, so with the O you can apply them to NPCs.</span> It is very useful for those using HIMBO and UBE. <span class="cat-highlight">If you use these, do not set this to false. It needs to stay true.</span>'
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const JSON_TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;

const MASTER_KEYS = new Set(KEY_ORDER);

const MASTER_KEYS_AQUA = new Set([
  'npcFormID',
  'npc',
  'factionFemale',
  'factionMale',
  'npcPluginFemale',
  'npcPluginMale',
  'raceFemale',
  'raceMale'
]);

const MASTER_KEYS_GREEN = new Set([
  'blacklistedNpcs',
  'blacklistedNpcsFormID',
  'blacklistedNpcsPluginFemale',
  'blacklistedNpcsPluginMale',
  'blacklistedRacesFemale',
  'blacklistedRacesMale',
  'blacklistedPresetsShowInOBodyMenu'
]);

const MASTER_KEYS_YELLOW = new Set([
  'blacklistedOutfitsFromORefitFormID',
  'blacklistedOutfitsFromORefit',
  'blacklistedOutfitsFromORefitPlugin',
  'outfitsForceRefitFormID',
  'outfitsForceRefit',
  'blacklistedPresetsFromRandomDistribution'
]);

function getJsonKeyLevelClass(rawJson, matchOffset) {
  if (!rawJson || typeof matchOffset !== 'number') return 'json-key--l1';
  const lineStart = rawJson.lastIndexOf('\n', matchOffset - 1) + 1;
  const indentChunk = rawJson.slice(lineStart, matchOffset);
  const indentSpaces = (indentChunk.match(/^\s*/) || [''])[0].length;
  const level = Math.max(1, Math.floor(indentSpaces / 2));
  if (level <= 1) return 'json-key--l1';
  if (level === 2) return 'json-key--l2';
  return 'json-key--l3';
}

function extractJsonKeyName(keyTokenText) {
  const match = String(keyTokenText || '').match(/"([^"]+)"/);
  return match ? match[1] : '';
}

function renderJsonHtml(value) {
  const raw = JSON.stringify(value, null, 2);
  if (raw === undefined) return '';

  let result = '';
  let lastIndex = 0;

  raw.replace(JSON_TOKEN_REGEX, (match, keyToken, stringToken, boolToken, offset) => {
    result += escapeHtml(raw.slice(lastIndex, offset));

    if (keyToken) {
      const keyName = extractJsonKeyName(match);
      if (MASTER_KEYS.has(keyName)) {
        let masterColorClass = 'json-key--master-aqua';
        if (MASTER_KEYS_GREEN.has(keyName)) masterColorClass = 'json-key--master-green';
        else if (MASTER_KEYS_YELLOW.has(keyName)) masterColorClass = 'json-key--master-yellow';
        result += `<span class="json-key json-key--master ${masterColorClass}">${escapeHtml(match)}</span>`;
      } else {
        const levelClass = getJsonKeyLevelClass(raw, offset);
        result += `<span class="json-key ${levelClass}">${escapeHtml(match)}</span>`;
      }
    } else if (stringToken) {
      result += `<span class="json-string">${escapeHtml(match)}</span>`;
    } else if (boolToken) {
      result += `<span class="json-boolean">${escapeHtml(match)}</span>`;
    } else if (match === 'null') {
      result += '<span class="json-null">null</span>';
    } else {
      result += `<span class="json-number">${escapeHtml(match)}</span>`;
    }

    lastIndex = offset + match.length;
    return match;
  });

  result += escapeHtml(raw.slice(lastIndex));
  return result;
}

function setJson(container, value) {
  container.innerHTML = renderJsonHtml(value);
}

function getEmbeddedJson() {
  const embeddedEl = document.getElementById('catEmbeddedJson');
  if (!embeddedEl) return null;
  const text = (embeddedEl.textContent || '').trim();
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    if (data && typeof data === 'object') return data;
  } catch (_) {}
  return null;
}

function setExplanation(container, key) {
  const html = KEY_EXPLANATIONS[key];
  container.innerHTML = html || `Explanation for "${escapeHtml(key)}" coming soon.`;
}

function updateSelectedKeyPill(pillEl, keyName) {
  if (!pillEl) return;
  pillEl.textContent = keyName;
  pillEl.classList.add('is-visible');
  pillEl.classList.remove('pulse');
  void pillEl.offsetWidth;
  pillEl.classList.add('pulse');
}

function scrollJsonViewerToKey(viewerEl, keyName) {
  if (!viewerEl || !keyName) return;
  const findTarget = () => {
    const candidates = MASTER_KEYS.has(keyName)
      ? viewerEl.querySelectorAll('.json-key--master')
      : viewerEl.querySelectorAll('.json-key');

    for (const node of candidates) {
      const extracted = extractJsonKeyName(node ? node.textContent || '' : '');
      if (extracted === keyName) return node;
    }

    if (candidates.length !== 0) return null;

    const fallbackNodes = viewerEl.querySelectorAll('.json-key');
    for (const node of fallbackNodes) {
      const extracted = extractJsonKeyName(node ? node.textContent || '' : '');
      if (extracted === keyName) return node;
    }
    return null;
  };

  const target = findTarget();

  if (!target) return;

  viewerEl.querySelectorAll('.cat-json-key-highlight').forEach((el) => el.classList.remove('cat-json-key-highlight'));

  requestAnimationFrame(() => {
    const viewerRect = viewerEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const topPaddingPx = 10;
    const desiredTop = (targetRect.top - viewerRect.top) + viewerEl.scrollTop - topPaddingPx;
    viewerEl.scrollTo({ top: Math.max(0, desiredTop), behavior: 'smooth' });
  });

  viewerEl.classList.remove('cat-json-scroll-focus');
  void viewerEl.offsetWidth;
  viewerEl.classList.add('cat-json-scroll-focus');
  setTimeout(() => {
    viewerEl.classList.remove('cat-json-scroll-focus');
  }, 700);

  target.classList.add('cat-json-key-highlight');
  setTimeout(() => {
    target.classList.remove('cat-json-key-highlight');
  }, 750);
}

function initialize() {
  const sampleContainer = document.getElementById('catJsonSample');
  const keysList = document.getElementById('catJsonKeysList');
  const explanationEl = document.getElementById('catKeyExplanation');
  const previewEl = document.getElementById('catKeyJsonPreview');
  const selectedKeyPill = document.getElementById('catSelectedKeyPill');

  let activeJson = SAMPLE_JSON;
  let lastSelectedKey = null;

  if (!sampleContainer || !keysList || !explanationEl || !previewEl) return;

  const embeddedJson = getEmbeddedJson();
  if (embeddedJson) {
    activeJson = embeddedJson;
    setJson(sampleContainer, embeddedJson);
  } else {
    sampleContainer.textContent = 'Loading example JSON...';
  }

  fetch('OBody_presetDistributionConfig.json')
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (data && typeof data === 'object') {
        activeJson = data;
        setJson(sampleContainer, data);
        if (lastSelectedKey) scrollJsonViewerToKey(sampleContainer, lastSelectedKey);
      }
    })
    .catch(() => {
      if (!embeddedJson) {
        activeJson = SAMPLE_JSON;
        setJson(sampleContainer, SAMPLE_JSON);
      }
      if (lastSelectedKey) scrollJsonViewerToKey(sampleContainer, lastSelectedKey);
    });

  KEY_ORDER.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-mini btn-secondary cat-key-btn';
    btn.textContent = key;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      lastSelectedKey = key;
      keysList.querySelectorAll('.cat-key-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateSelectedKeyPill(selectedKeyPill, key);
      scrollJsonViewerToKey(sampleContainer, key);
      setExplanation(explanationEl, key);
      if (Object.prototype.hasOwnProperty.call(activeJson, key)) {
        setJson(previewEl, activeJson[key]);
      } else {
        previewEl.textContent = 'This key is not present in the example JSON.';
      }
    });
    keysList.appendChild(btn);
  });
}

document.addEventListener('DOMContentLoaded', initialize);
