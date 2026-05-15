//========================================
// Tensor Flow
//========================================
let modelPromise = null;

let useModel = null;

async function loadUSE() {
  if (!useModel) {
    useModel = await use.load();
  }
  return useModel;
}

async function embedItemsInBatches(batchSize = 100) {
    const model = await loadUSE();
    const result = [];
    
    test = []
    for (var i = 0; i < 2000; i++) {
        test.push(wItems[i])
    }
  
    for (let i = 0; i < test.length; i += batchSize) {
      const batch = test.slice(i, i + batchSize);
      const descriptions = batch.map(item => item.details.description);
      const embeddings = await model.embed(descriptions);
      const tensors = await embeddings.array();
  
      tensors.forEach((vec, j) => {
        result.push({
          ...batch[j],
          tensor: tf.tensor1d(vec),
        });
      });
  
      tf.dispose(embeddings); // Free memory
    }
  
    return result;
  }

async function getModel() {
  if (!modelPromise) {
    modelPromise = use.load();
  }
  return modelPromise;
}

// Utility to split array into chunks
function chunkArray(arr, chunkSize) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

async function findMostSimilar(wItems, description, topN = 20, batchSize = 20) {
    const model = await use.load();

    const candidates = wItems.filter(item => typeof item.details?.description === 'string' && item.details?.school.includes('evocation'));
    const allDescriptions = candidates.map(item => item.details.description);

    function chunkArray(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    const inputEmbedding = await model.embed([description]);
    const batches = chunkArray(allDescriptions, batchSize);

    const similarityScores = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        // Check if all tensors in the batch are valid
        const validBatch = batch.filter((desc, j) => {
            const tensor = candidates[i * batchSize + j]?.tensor;
            console.log(`Processing tensor for ${candidates[i * batchSize + j].name}`);
            return tensor && !tensor.isDisposedInternal;
        });

        if (validBatch.length === 0) {
            console.error("No valid tensors in batch", i);
            continue; // Skip this batch if no valid tensors are found
        }

        const batchEmbedding = await model.embed(validBatch);

        const scoresTensor = tf.matMul(inputEmbedding, batchEmbedding, false, true);
        const scores = await scoresTensor.array();
        scoresTensor.dispose();
        batchEmbedding.dispose();

        batch.forEach((desc, j) => {
            const globalIndex = i * batchSize + j;
            similarityScores.push({ item: candidates[globalIndex], score: scores[0][j] });
        });
    }

    inputEmbedding.dispose();

    similarityScores.sort((a, b) => b.score - a.score);
    return similarityScores.slice(0, topN);
}


  async function exportVectors() {
    console.log(wItems.length)
    // Step 1: Get your tensor embeddings
    const vectoredItems = await embedItemsInBatches();

    // Step 2: Convert tensor data into a plain array
    const vectoredItemsWithArrayData = vectoredItems.map(item => ({
        ...item,
        tensorData: item.tensor.arraySync()  // Convert tensor to an array
    }));

    // Step 3: Create a JSON object with the tensor data included
    const json = JSON.stringify(vectoredItemsWithArrayData, null, 2);

    // Step 4: Create a Blob and download the JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'distinct_w_items.json';
    a.click();
    URL.revokeObjectURL(url);  // Clean up the URL object
}

async function exportFiltered() {
    const filteredItems = items.map((item) => {return{name: item.name, details: item.details, link: item.link}})

    // Step 3: Create a JSON object with the tensor data included
    const json = JSON.stringify(filteredItems, null, 2);

    // Step 4: Create a Blob and download the JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'distinct_w_items.json';
    a.click();
    URL.revokeObjectURL(url);  // Clean up the URL object
}

//========================================
// Tensor Flow END
//========================================

function elem(name) {
return document.getElementById(name);
}

function val(name) {
return elem(name).value;
}

var errorColor = "#FA5858";
var baseColor = "white";
var boxes = ["DC", "GP", "SP", "CP", "PriorWork", "Check", "ItemMultiple"];
var bools = ["IsMaster", "IsSwift", "IsByDay"];

function getDistinctItemsByName() {
    const seen = new Set();
    return wItems.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
    });
}

function searchItem() {
    elem('search_spell_wrapper').innerHTML = ''
    elem('footer').style.display='flex'
    const term = val('Search_Item')

    if (term === '' && filteredClasses.length === 0 && filteredSchools.length === 0) {
        filteredItems = []
        return 
    }

    const filteredItems = items.filter((item) => findByClass(item, filteredClasses) && findBySchool(item, filteredSchools) && (findInName(item, term) || findInDesc(item, term)))
    for (const filteredItem of filteredItems) {
        const index = items.findIndex((item) => item.name === filteredItem.name);
        const itemUnit = document.createElement('div')
        itemUnit.setAttribute('class', 'm-2 bg-secondary text-light p-4 col-md-5 col-11 ')
        itemUnit.setAttribute('style', 'border-radius: 15px ')

        var descrArray = highlight(filteredItem.details.description, term).split('<table')

        for (let i = 0; i < descrArray.length; i++) {
            if (i !== descrArray.length - 1) {
                descrArray[i] += `<table class="descrTable" `
            }
        }
        
        itemUnit.innerHTML= `
            <div class="itemname d-flex justify-content-between">
                <a href="${filteredItem.link}" target="_blank"><b>${highlight(filteredItem.name, term)}</b></a>
                <div class="d-flex gap-3">
                    <i class="bi bi-caret-down-fill" id="s-item-toggle-down-${index}" onclick="toggleItemDetails(${index},'s')" style="cursor: pointer;"></i>
                    <i class="bi bi-caret-up-fill" id="s-item-toggle-up-${index}" onclick="toggleItemDetails(${index},'s')" style="cursor: pointer; display: none;"></i>
                    <button type="button" class="btn btn-primary btn-sm" onclick="addSpellToNewItem('${filteredItem.name.replace(/'/g, "\\'")}')">Add to Item</button>
                </div>
            </div>
            <div id="s-item-id-${index}" style="display: none;">
                <div class="d-flex flex-wrap gap-2 mt-2">
                    <div class="text-wrap d-flex"><b>School:</b>&nbsp;${filteredItem.details.school}</div>
                    <div class="text-wrap d-flex"><b>Level:</b>&nbsp;${filteredItem.details.level}</div>
                </div>
                <div class="catlabel">
                    <b>CASTING</b>
                </div>
                <div class="text-wrap"><b>Casting Time:</b>&nbsp;${filteredItem.details.casting_time}</div>
                <div class="text-wrap"><b>Components:</b>&nbsp;${filteredItem.details.components}</div>
                <div class="catlabel">
                    <b>EFFECT</b>
                </div>
                <div class="text-wrap"><b>Range:</b>&nbsp;${filteredItem.details.range}</div>
                <div class="text-wrap"><b>Target:</b>&nbsp;${filteredItem.details.target}</div>
                <div class="text-wrap"><b>Duration:</b>&nbsp;${filteredItem.details.duration}</div>
                <div class="d-flex flex-wrap gap-2">
                    <div class="text-wrap d-flex"><b>Saving Throw:</b>&nbsp;${filteredItem.details.saving_throw}</div>
                    <div class="text-wrap d-flex"><b>Spell Resistance:</b>&nbsp;${filteredItem.details.spell_resistance}</div>
                </div>
                <div class="catlabel">
                    <b>DESCRIPTION</b>
                </div>
                <div class="description" id="Description">${descrArray.join()}</div>
            </div>
        `
        elem('search_spell_wrapper').appendChild(itemUnit)
    }
}

function searchWItem() {
    elem('search_w_item_wrapper').innerHTML = ''
    elem('footer').style.display='flex'
    const term = val('Search_W_Item')

    if (term === '' && filteredItemTypes.length === 0 && filteredItemSlots.length === 0) {
        filteredItems = []
        return 
    }

    const filteredItems = wItems.filter((item) => findInType(item, filteredItemTypes) && findInSlot(item, filteredItemSlots) && (findInName(item, term) || findInDesc(item, term)))
    for (const filteredItem of filteredItems) {
        const index = wItems.findIndex((item) => item.name === filteredItem.name);
        const itemUnit = document.createElement('div')
        itemUnit.setAttribute('class', 'm-2 bg-secondary text-light p-2 col-md-5 col-11 ')
        itemUnit.setAttribute('style', 'border-radius: 15px ')

        var descrArray = highlight(filteredItem.details.description, term).split('<table')

        for (let i = 0; i < descrArray.length; i++) {
            if (i !== descrArray.length - 1) {
                descrArray[i] += `<table class="descrTable" `
            }
        }

        const typeIcon = filteredItem.details.type ? getIconName(filteredItem.details.type) : ''
        const slotIcon = filteredItem.details.slot ? getIconName(filteredItem.details.slot) : ''
        
        itemUnit.innerHTML= `
            <div class="itemname d-flex justify-content-between">
                <div class="d-flex gap-1">
                    <a href="${filteredItem.link}" target="_blank"><b>${highlight(filteredItem.name, term)}</b></a>
                    ${slotIcon}
                    ${typeIcon}
                </div>
                <div class="d-flex gap-3">
                    <i class="bi bi-caret-down-fill" id="w-item-toggle-down-${index}" onclick="toggleItemDetails(${index}, 'w')" style="cursor: pointer;"></i>
                    <i class="bi bi-caret-up-fill" id="w-item-toggle-up-${index}" onclick="toggleItemDetails(${index}, 'w')" style="cursor: pointer; display: none;"></i>
                    <button type="button" class="btn btn-primary btn-sm">test</button>
                </div>
            </div>
            <div id="w-item-id-${index}" style="display: none;">
                <div class="d-flex flex-wrap gap-2 mt-2">
                    <div class="text-wrap d-flex"><b>Aura:</b>&nbsp;${filteredItem.details.aura}</div>
                    <div class="text-wrap d-flex"><b>CL:</b>&nbsp;${filteredItem.details.cl}</div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                    <div class="text-wrap d-flex"><b>Slot:</b>&nbsp;${filteredItem.details.slot}</div>
                    <div class="text-wrap d-flex"><b>Price:</b>&nbsp;${filteredItem.details.price}</div>
                    <div class="text-wrap d-flex"><b>Weight:</b>&nbsp;${filteredItem.details.weight}</div>
                </div>
                <div class="catlabel">
                    <b>DESCRIPTION</b>
                </div>
                <div class="description" id="Description">${descrArray.join()}</div>
                <div class="catlabel">
                    <b>CONSTRUCTION</b>
                </div>
                <div class="text-wrap"><b>Requirements:</b>&nbsp;${filteredItem.details.requirements}</div>
                <div class="text-wrap"><b>Cost:</b>&nbsp;${filteredItem.details.cost}</div>
            </div>
        `
        elem('search_w_item_wrapper').appendChild(itemUnit)
    }
}

function createItemSpells() {
    const compactDiv = document.getElementById(`new-item-spells-wrapper`);
    const detailedDiv = document.getElementById(`spell-req-details`);
    const detailedItemDiv = document.getElementById(`spell-req-details-items`);
    compactDiv.innerHTML = ''
    detailedItemDiv.innerHTML = ''

    detailedDiv.style.display = newItemSpells.length > 0 ? 'block' : 'none';
    for (const spell of newItemSpells) {
        compactDiv.innerHTML += `
        <div class="d-flex flex-wrap gap-2">
            <b>${spell.name}</b>
            <i class="bi bi-x-circle fw-bold" style="color: red; font-weight: bold;" onclick="removeSpell('${spell.name.replace(/'/g, "\\'")}')"></i>
        </div>
        `
        detailedItemDiv.innerHTML += `
            <div class="d-flex gap-4">
                <b>${spell.name}</b>
                <select onchange="handleChangeSpellEffect(this, '${spell.name.replace(/'/g, "\\'")}')">
                ${generateSpellEffectSelect()}
                </select>
                <i class="bi bi-x-circle fw-bold" style="color: red; font-weight: bold;" onclick="removeSpell('${spell.name.replace(/'/g, "\\'")}')"></i>
            </div>
            <hr>
        `
    }
}

function generateSpellEffectSelect() {
    let options = ''
    for(let i = 0; i < spellEffects.length; i++) {
        options += `<option value="${i}">${spellEffects[i].name}</option>`
    }
    return options
}

function generateBonusEffectSelect(name ) {
    let options = ''
    for(let i = 0; i < bonusEffects.length; i++) {
        options += `<option value="${bonusEffects[i].name}" ${name === bonusEffects[i].name ? `selected` : ``}>${bonusEffects[i].name}</option>`
    }
    return options
}

function generateBonusSpecialSelect(name, special) {
    let options = ''
    const list = name === 'Ability bonus (enhancement)' ? abilityBonuses : skills
    for(let i = 0; i < list.length; i++) {
        options += `<option value="${list[i]}" ${special === list[i] ? `selected` : ``}>${list[i]}</option>`
    }
    return options
}

function getSpellLevel(item) {
    return item.details.level
    .split(", ")
    .map(entry => {
      const [cls, lvl] = entry.split(" ");
      return { class: cls, level: parseInt(lvl) };
    })
    .sort((a, b) => a.level - b.level);
}

function addSpellToNewItem(name) {
    const item = items.find(spell => spell.name === name)
    if (newItemSpells.find(spell => spell.name === item.name)) return
    newItemSpells.push({...item, effect: 0})
    createItemSpells()
    calculateCost()
}

function removeSpell(name) {
    newItemSpells = newItemSpells.filter((item) => item.name !== name)
    createItemSpells()
    calculateCost()
}

function removeBonus(idx) {
    newItemBonuses.splice(Number(idx), 1)
    createBonuses()
    calculateCost()
}

function calculateCost() {
    const spells = calculateSpellCost()
    const bonus = calculateBonuses()
    const spellResistance = 0

    const finalCost = spells + bonus
    const costDiv = document.getElementById(`new-cost`);
    costDiv.innerHTML = `<b>Cost:</b>&nbsp;${finalCost/2}&nbsp;gp`
    const priceDiv = document.getElementById(`new-price`);
    priceDiv.innerHTML = `<b>Cost:</b>&nbsp;${finalCost}&nbsp;gp`
}

function calculateSpellCost() {
    var spells = 0
    let maxCasterlevel = 1
    for (let spell of newItemSpells) {
        const spellLevels = getSpellLevel(spell)
        const spellLevel = spellLevels.find((item) => item.class === caster) || spellLevels[0]
        const spellcastingClass = spellcastingClasses.find((sClass) => sClass.name === spellLevel.class)
        const casterLevel = calculateCasterLevel(spellLevel, spellcastingClass)
        if (casterLevel > maxCasterlevel) {
            maxCasterlevel = casterLevel
        }
        document.getElementById(`caster-level-label`).innerHTML = `CL:</b>&nbsp;${maxCasterlevel}`;

        spells += spellLevel.level === 0 ? 0.5 * casterLevel * spellEffects[spell.effect].mult : spellLevel.level * casterLevel * spellEffects[spell.effect].mult
    }
    return spells
}

function calculateBonuses() {
    var bonuses = 0
    for (let bonus of newItemBonuses) {
        const bonusRef = bonusEffects.find((item) => item.name === bonus.name)
        if (bonus.name === 'Spell resistance') {
            const value = bonus.value <= 13 ? 1 : bonus.value - 12
            bonuses += value * bonusRef.mult
        } else {
            bonuses += Math.pow(bonus.value, 2) * bonusRef.mult
        }
    }
    return bonuses
}

function calculateCasterLevel(spellLevel, spellcastingClass) {
    if (spellcastingClass.levelsPerSpellLevel === 2) {
        return spellLevel.level === 0 || spellLevel.level === 1 ? 1 : (spellLevel.level * (spellcastingClass.levelsPerSpellLevel)) - 1
    }
    if (spellcastingClass.levelsPerSpellLevel === 2.5) {
        if (spellLevel.level === 0 || spellLevel.level === 1) return 1
        if (spellLevel.level === 2) return 4
        return (spellLevel.level * (Math.floor(spellcastingClass.levelsPerSpellLevel)))
    }
    else if (spellcastingClass.levelsPerSpellLevel === 3) {
        return spellLevel.level === 0 || spellLevel.level === 1 ? 1 : 1 + ((spellLevel.level - 1) * spellcastingClass.levelsPerSpellLevel) 
    }
    else if (spellcastingClass.levelsPerSpellLevel === 4) {
        if (spellLevel.level === 0 || spellLevel.level === 1) return 4
        return spellLevel.level === 0 || spellLevel.level === 1 ? 1 : 4 + (spellLevel.level - 1) * 3 
    }
}

function searchWItemFilters() {
    const detailDiv = document.getElementById(`item-filters-wrapper`);
    if (detailDiv) {
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
    }
}

function searchSpellFilters() {
    const detailDiv = document.getElementById(`spell-filters-wrapper`);
    if (detailDiv) {
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
    }
}

function wItemSlotCheck() {
    filteredItemSlots = itemSlots.filter((item) => document.getElementById(`filter-slot-${item}`).checked)
    searchWItem()

}

function wItemTypeCheck() {
    filteredItemTypes = itemTypes.filter((item) => document.getElementById(`filter-slot-${item}`).checked)
    searchWItem()
}

function spellSchoolCheck() {
    filteredSchools = spellSchools.filter((item) => document.getElementById(`filter-slot-${item}`).checked)
    searchItem()
}

function spellClassCheck(e) {
    filteredClasses = spellClasses.filter((item) => document.getElementById(`filter-slot-${item}`).checked)
    searchItem()
}

function handleChangeClass(e) {
    caster = e.value
    calculateCost()
}

function addNewBonus() {
    const detailedDiv = document.getElementById(`bonus-req-details`);
    const detailedItemDiv = document.getElementById(`bonus-req-details-items`);
    detailedItemDiv.innerHTML = ''

    if (newItemBonuses.length === 0) {
        detailedDiv.style.display = 'block'
    }
    var newBonus = {name: 'Ability bonus (enhancement)', special: abilityBonuses[0], value: 1}
    
    if (newBonus !== null) {newItemBonuses.push(newBonus)}

    createBonuses()
    calculateCost()
}

function createBonuses() {
    const detailedDiv = document.getElementById(`bonus-req-details`);
    const detailedItemDiv = document.getElementById(`bonus-req-details-items`);

    detailedDiv.style.display = newItemBonuses.length === 0 ? 'none' : 'block'

    detailedItemDiv.innerHTML = ''

    for (let i = 0; i < newItemBonuses.length; i++) {
        console.log(newItemBonuses)
        detailedItemDiv.innerHTML += `
            <div class="d-flex gap-4 flex-wrap">
                <select onchange="handleChangeBonusType(this, '${i}')">
                    ${generateBonusEffectSelect(newItemBonuses[i].name)}
                </select>
                ${
                    newItemBonuses[i].special ? 
                    `
                        <select onchange="handleChangeBonusSpecial(this, '${i}')">
                            ${generateBonusSpecialSelect(newItemBonuses[i].name, newItemBonuses[i].special)}
                        </select>
                    `
                    : ''
                }
                Value:
                <input id='bonus-type-${i}' type=text value='${newItemBonuses[i].value}' onchange="handleChangeBonusValue(this, '${newItemBonuses[i].value}', '${i}')" style='max-width:40px'></input>
                <i class="bi bi-x-circle fw-bold" style="color: red; font-weight: bold; cursor: pointer;" onclick="removeBonus('${i}')"></i>
            </div>
            <hr>
        `
    }
}

function handleChangeSpellEffect(e, name) {
    const spellIdx = newItemSpells.findIndex((item) => item.name === name)
    newItemSpells[spellIdx].effect = e.value
    calculateCost()
}

function handleChangeBonusType(e, index) {
    newItemBonuses[Number(index)].name = e.value

    delete newItemBonuses[Number(index)].special
    if (e.value === 'Weapon bonus (enhancement)') {
        newItemBonuses[Number(index)].special = abilityBonuses[0]
    }
    else if (e.value === 'Skill bonus (competence)') {
        newItemBonuses[Number(index)].special = skills[0]
    }
    
    const valueDiv = document.getElementById(`bonus-type-${index}`);
    handleChangeBonusValue(valueDiv, valueDiv.value, index)
    calculateCost()
    createBonuses()
}

function handleChangeBonusSpecial(e, index) {
    newItemBonuses[Number(index)].special = e.value
}

function handleChangeBonusValue(e, previousValue, index) {
    if (/^[1-9]\d*$/.test(e.value)) {
        if (newItemBonuses[Number(index)].name === 'Bonus spell' && Number(e.value) > 9) {
            newItemBonuses[Number(index)].value = 9
        } 
        else if (newItemBonuses[Number(index)].name === 'Weapon bonus (enhancement)' && Number(e.value) > 5) {
            newItemBonuses[Number(index)].value = 5
        }
        else if (newItemBonuses[Number(index)].name === 'Armor bonus (enhancement)' && Number(e.value) > 5) {
            newItemBonuses[Number(index)].value = 5
        }
        else if (newItemBonuses[Number(index)].name === 'Spell resistance' && Number(e.value) < 13) {
            newItemBonuses[Number(index)].value = 13
        }
        else {
            newItemBonuses[Number(index)].value = Number(e.value)
        }
    } else {
        newItemBonuses[Number(index)].value = Number(previousValue)
    }
    calculateCost()
    createBonuses()
}

function getIconName(type) {
    switch (type) {
        case 'cursed':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-skull"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 4c4.418 0 8 3.358 8 7.5c0 1.901 -.755 3.637 -2 4.96l0 2.54a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-2.54c-1.245 -1.322 -2 -3.058 -2 -4.96c0 -4.142 3.582 -7.5 8 -7.5z" /><path d="M10 17v3" /><path d="M14 17v3" /><path d="M9 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M15 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /></svg>'
        case 'ring':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circles-relation"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9.183 6.117a6 6 0 1 0 4.511 3.986" /><path d="M14.813 17.883a6 6 0 1 0 -4.496 -3.954" /></svg>'
        case 'chest':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-shirt"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0" /></svg>'
        case 'belt':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-air-conditioning-disabled"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 8m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M7 16v-3a1 1 0 0 1 1 -1h8a1 1 0 0 1 1 1v3" /></svg>'
        case 'body':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-man"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 16v5" /><path d="M14 16v5" /><path d="M9 9h6l-1 7h-4z" /><path d="M5 11c1.333 -1.333 2.667 -2 4 -2" /><path d="M19 11c-1.333 -1.333 -2.667 -2 -4 -2" /><path d="M12 4m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /></svg>'
        case 'eyes':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-eyeglass-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 4h-2l-3 10v2.5" /><path d="M16 4h2l3 10v2.5" /><path d="M10 16l4 0" /><path d="M17.5 16.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" /><path d="M6.5 16.5m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" /></svg>'
        case 'feet':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-shoe"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 6h5.426a1 1 0 0 1 .863 .496l1.064 1.823a3 3 0 0 0 1.896 1.407l4.677 1.114a4 4 0 0 1 3.074 3.89v2.27a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10a1 1 0 0 1 1 -1z" /><path d="M14 13l1 -2" /><path d="M8 18v-1a4 4 0 0 0 -4 -4h-1" /><path d="M10 12l1.5 -3" /></svg>'
        case 'hands':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-hand-stop"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" /><path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" /><path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5" /><path d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" /></svg>'
        case 'head':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-crown"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" /></svg>'
        case 'headband':
            return `<svg fill="#ffffff" height="24" width="24" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                    viewBox="0 0 510.681 510.681" xml:space="preserve">
                <g>
                    <g>
                        <g>
                            <path d="M55.765,352.109c-2.603-0.597-5.163-1.259-7.552-2.304c-2.795-1.237-5.995-1.237-8.811,0.043
                                c-2.773,1.28-4.885,3.691-5.781,6.635c-5.568,18.624-9.259,37.333-10.944,55.595c-0.491,5.483,3.243,10.453,8.661,11.456
                                c0.661,0.128,1.323,0.192,1.963,0.192c4.672,0,8.917-3.115,10.24-7.744c4.629-16.299,11.136-32.64,19.307-48.597
                                c1.493-2.923,1.579-6.379,0.171-9.344C61.675,355.01,58.965,352.834,55.765,352.109z"/>
                            <path d="M286.379,87.106c-1.835,0.299-3.563,1.045-5.035,2.219l-104.747,83.563c-0.427-0.107-0.832-0.043-1.259-0.107
                                c-1.536-0.235-3.072-0.491-4.672-0.491c-0.277,0-0.512,0.064-0.789,0.085c-0.64,0.021-1.237,0.128-1.877,0.192
                                c-1.856,0.149-3.669,0.427-5.419,0.896c-0.256,0.085-0.491,0.149-0.747,0.256c-4.651,1.344-8.832,3.669-12.352,6.784
                                L12.885,151.213c-3.157-0.597-6.443,0.128-8.939,2.133C1.451,155.394,0,158.402,0,161.623
                                c0,27.093,22.016,167.893,63.296,170.645c0.235,0.021,0.469,0.021,0.704,0.021c2.816,0,5.525-1.131,7.552-3.115l93.419-93.419
                                c0.128,0.021,0.235-0.021,0.363,0c1.728,0.299,3.499,0.533,5.333,0.533c1.792,0,3.541-0.235,5.269-0.533
                                c0.256-0.043,0.512-0.021,0.747-0.085c3.392-0.64,6.528-1.92,9.472-3.563c0.299-0.171,0.64-0.171,0.939-0.363
                                c21.611,9.472,67.029,25.877,122.24,25.877c3.072,0,5.995-1.344,8.021-3.648c19.435-22.187,7.659-116.544-6.549-147.883
                                C304.661,92.567,295.595,85.847,286.379,87.106z"/>
                            <path d="M510.635,412.077c-8.811-95.893-65.067-179.307-146.795-217.749c-3.328-1.579-7.189-1.323-10.261,0.64
                                c-3.093,1.963-4.949,5.376-4.928,9.024c0.021,14.4-1.173,27.093-3.563,37.717c-1.131,5.013,1.493,10.133,6.229,12.139
                                c65.771,28.053,117.547,88.661,138.453,162.133c1.323,4.672,5.568,7.744,10.24,7.744c0.661,0,1.323-0.064,1.963-0.192
                                C507.392,422.53,511.147,417.559,510.635,412.077z"/>
                        </g>
                    </g>
                </g>
            </svg>`
        case 'neck':
            return `<svg fill="none" width="24" height="24" viewBox="0 0 24 24"   stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"    xmlns="http://www.w3.org/2000/svg"><path d="M15.185,1.018a1,1,0,1,0-.37,1.964C18.341,3.647,21,5.805,21,8c0,2.71-4.122,5-9,5S3,10.71,3,8c0-2.2,2.659-4.353,6.185-5.018a1,1,0,1,0-.37-1.964C4.287,1.871,1,4.808,1,8c0,3.049,2.922,5.578,7.116,6.558A.985.985,0,0,0,8,15v6a1,1,0,0,0,.684.948l3,1a.986.986,0,0,0,.632,0l3-1A1,1,0,0,0,16,21V15a.985.985,0,0,0-.116-.442C20.078,13.578,23,11.049,23,8,23,4.808,19.713,1.871,15.185,1.018ZM14,20.279l-2,.667-2-.667V15.721l2-.667,2,.667Z"/></svg>`
        case 'shoulders':
            return `<svg fill="none" width="24" height="24" viewBox="0 0 512 512"   stroke="currentColor"  stroke-width="30"  stroke-linecap="round"  stroke-linejoin="round"    xmlns="http://www.w3.org/2000/svg"><path d="M256 23.316c-27.177 0-58.578 5.75-79.525 17.967-20.688 13.774-43.22 60.756-43.22 60.756-3.112 5.22-6.173 10.658-9.16 16.376-36.372 69.627-61.496 175.763-62.4 317.686 46.593 26.853 97.436 44.53 142.05 52.582-21.736-14.917-40.667-38.325-55.18-67.618 36.913-4.56 78.545-9.817 107.314-9.818 29.802 0 73.456 5.63 111.32 10.29-14.484 29.072-33.326 52.308-54.946 67.144 44.615-8.052 91.458-25.727 138.05-52.58-.903-141.923-26.027-248.06-62.4-317.686-2.986-5.718-6.047-11.156-9.16-16.375v-.003s-22.53-46.98-43.22-60.754c-23.52-11.95-52.347-17.967-79.524-17.967zm-.045 16.22c30.187 3.09 57.525 4.198 76.307 24.67-18.46 21.81-45.975 49.5-76.29 49.503-30.302.002-66.432-30.935-76.27-49.468 17.72-19.566 53.18-24.537 76.253-24.707zM170.57 80c5.43 12.588 52.522 49.167 85.375 49.25C289.09 129.333 336 91.16 342.32 80c0 0 12.28 18.68 18.594 31.057l4.55 10.906c20.518 45.148 32.614 92.753 32.614 158.1 0 45.65-8.408 88.144-22.873 123.724-32.45-4.387-73.958-7.39-119.205-7.39-43.513 0-83.54 2.78-115.408 6.896-14.34-35.48-22.67-77.792-22.67-123.23 0-65.347 8.096-112.952 28.613-158.1l4.55-10.906C157.378 98.725 170.57 80 170.57 80z"/></svg>`
        case 'wrist':
            return `<svg fill="#ffffff" height="24" width="24" stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                    viewBox="0 0 512 512" xml:space="preserve">
                <g>
                    <g>
                        <path d="M440,256V120c0-22.091-17.909-40-40-40c-2.741,0-5.416,0.277-8,0.803V40c0-22.091-17.909-40-40-40
                            c-21.824,0-39.554,17.478-39.979,39.2h-0.04C311.552,17.482,293.822,0,272,0s-39.552,17.482-39.979,39.2h-0.04
                            C231.552,17.482,213.822,0,192,0s-39.552,17.482-39.979,39.2h-0.04C151.552,17.482,133.822,0,112,0C89.909,0,72,17.909,72,40v200
                            l32,80v192h256v-48h64v-48h-64v-96L440,256z M312,464H152v-48h160V464z M312,296.93V368H152v-57.243l-32-80V88.8h224v50.768
                            l48-9.778V232.93L312,296.93z"/>
                    </g>
                </g>
                </svg>`
        case 'wrists':
            return `<svg fill="#ffffff" height="24" width="24" stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                    viewBox="0 0 512 512" xml:space="preserve">
                <g>
                    <g>
                        <path d="M440,256V120c0-22.091-17.909-40-40-40c-2.741,0-5.416,0.277-8,0.803V40c0-22.091-17.909-40-40-40
                            c-21.824,0-39.554,17.478-39.979,39.2h-0.04C311.552,17.482,293.822,0,272,0s-39.552,17.482-39.979,39.2h-0.04
                            C231.552,17.482,213.822,0,192,0s-39.552,17.482-39.979,39.2h-0.04C151.552,17.482,133.822,0,112,0C89.909,0,72,17.909,72,40v200
                            l32,80v192h256v-48h64v-48h-64v-96L440,256z M312,464H152v-48h160V464z M312,296.93V368H152v-57.243l-32-80V88.8h224v50.768
                            l48-9.778V232.93L312,296.93z"/>
                    </g>
                </g>
                </svg>`
        case 'other':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-diamond"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 5h12l3 5l-8.5 9.5a.7 .7 0 0 1 -1 0l-8.5 -9.5l3 -5" /><path d="M10 12l-2 -2.2l.6 -1" /></svg>'
        case 'staff':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-cane"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 21l6.324 -11.69c.54 -.974 1.756 -4.104 -1.499 -5.762c-3.255 -1.657 -5.175 .863 -5.825 2.032" /></svg>'
        case 'rod':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-wand"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 21l15 -15l-3 -3l-15 15l3 3" /><path d="M15 6l3 3" /><path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /><path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" /></svg>'
        case 'weapon':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-sword"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z" /><path d="M6.5 11.5l6 6" /></svg>'
        case 'armor':
            return `<svg fill="#ffffff" width="24" height="24" viewBox="0 0 32 32" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:serif="http://www.serif.com/" xmlns:xlink="http://www.w3.org/1999/xlink">
                <g id="Icon">
                <path d="M25,21.5c0,-0.319 -0.152,-0.619 -0.409,-0.807c-0.258,-0.188 -0.589,-0.243 -0.893,-0.146l-7.698,2.44c-0,0 -7.698,-2.44 -7.698,-2.44c-0.304,-0.097 -0.635,-0.042 -0.893,0.146c-0.257,0.188 -0.409,0.488 -0.409,0.807l0,6c0,0.552 0.448,1 1,1l16,0c0.552,0 1,-0.448 1,-1l0,-6Zm-2,1.366l0,3.634l-14,0c0,-0 0,-3.634 0,-3.634c0,0 6.698,2.123 6.698,2.123c0.196,0.063 0.408,0.063 0.604,0l6.698,-2.123Zm-2.002,-14.31c0.02,-0.341 -0.137,-0.668 -0.414,-0.868c-0.278,-0.199 -0.638,-0.243 -0.955,-0.116l-2.5,1c-0.38,0.151 -0.629,0.519 -0.629,0.928l0,11c0,0.317 0.151,0.616 0.406,0.804c0.255,0.189 0.585,0.245 0.888,0.152l6.5,-2c0.42,-0.129 0.706,-0.517 0.706,-0.956l0,-6c0,-0.552 -0.448,-1 -1,-1c-0.892,0 -1.663,-0.246 -2.203,-0.739c-0.516,-0.472 -0.797,-1.166 -0.797,-2.02c0,-0.062 -0.005,-0.124 -0.002,-0.185Zm-8.627,-0.984c-0.317,-0.127 -0.677,-0.083 -0.955,0.116c-0.277,0.2 -0.434,0.527 -0.414,0.868c0.003,0.061 -0.002,0.123 -0.002,0.185c0,0.854 -0.281,1.548 -0.797,2.02c-0.54,0.493 -1.311,0.739 -2.203,0.739c-0.552,0 -1,0.448 -1,1l0,6c0,0.439 0.286,0.827 0.706,0.956l6.5,2c0.303,0.093 0.633,0.037 0.888,-0.152c0.255,-0.188 0.406,-0.487 0.406,-0.804l0,-11c0,-0.409 -0.249,-0.777 -0.629,-0.928l-2.5,-1Zm6.756,2.354c0.21,0.942 0.675,1.72 1.32,2.31c0.666,0.609 1.537,1.023 2.553,1.186c0,0 0,4.339 0,4.339c0,0 -4.5,1.385 -4.5,1.385c0,0 0,-8.969 0,-8.969l0.627,-0.251Zm-6.254,0l0.627,0.251c0,0 0,8.969 0,8.969c-0,0 -4.5,-1.385 -4.5,-1.385c0,0 0,-4.339 0,-4.339c1.016,-0.163 1.887,-0.577 2.553,-1.186c0.645,-0.59 1.11,-1.368 1.32,-2.31Zm-1.892,-5.23c0.058,-0.294 -0.018,-0.598 -0.208,-0.83c-0.19,-0.232 -0.473,-0.366 -0.773,-0.366c-1.611,0 -3.965,1.17 -5.569,2.638c-1.191,1.089 -1.931,2.354 -1.931,3.362c0,0.552 0.448,1 1,1l5.5,0l0.981,-0.804l1,-5Zm11.019,-1.196c-0.3,0 -0.583,0.134 -0.773,0.366c-0.19,0.232 -0.266,0.536 -0.208,0.83l1,5l0.981,0.804l5.5,0c0.552,0 1,-0.448 1,-1c-0,-1.008 -0.74,-2.273 -1.931,-3.362c-1.604,-1.468 -3.958,-2.638 -5.569,-2.638Zm-13.82,5l-3.216,0c0.222,-0.299 0.501,-0.598 0.816,-0.886c0.847,-0.775 1.944,-1.485 2.948,-1.852l-0.548,2.738Zm15.64,0l-0.548,-2.738c1.004,0.367 2.101,1.078 2.948,1.852c0.315,0.288 0.594,0.587 0.816,0.886l-3.216,0Z"/>
                </g>
                </svg>`
        case 'shield':
            return '<svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="#ffffff"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-shield"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /></svg>'
        default:
            return ''
    }
}

function toggleItemDetails(index, cat) {
    const detailDiv = document.getElementById(`${cat}-item-id-${index}`);
    if (detailDiv) {
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
    }
    const caretUpDiv = document.getElementById(`${cat}-item-toggle-up-${index}`);
    if (caretUpDiv) {
        const isHidden = caretUpDiv.style.display === 'none';
        caretUpDiv.style.display = isHidden ? 'block' : 'none';
    }
    const caretDownDiv = document.getElementById(`${cat}-item-toggle-down-${index}`);
    if (caretDownDiv) {
        const isHidden = caretDownDiv.style.display === 'none';
        caretDownDiv.style.display = isHidden ? 'block' : 'none';
    }
}

function toggleNew() {
    let detailDiv = document.getElementById(`new-wrapper-1`);
    if (detailDiv) {
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
    }
    detailDiv = document.getElementById(`new-wrapper-2`);
    if (detailDiv) {
        const isHidden = detailDiv.style.display === 'none';
        detailDiv.style.display = isHidden ? 'block' : 'none';
    }
    const caretUpDiv = document.getElementById(`new-toggle-up`);
    if (caretUpDiv) {
        const isHidden = caretUpDiv.style.display === 'none';
        caretUpDiv.style.display = isHidden ? 'block' : 'none';
    }
    const caretDownDiv = document.getElementById(`new-toggle-down`);
    if (caretDownDiv) {
        const isHidden = caretDownDiv.style.display === 'none';
        caretDownDiv.style.display = isHidden ? 'block' : 'none';
    }
}

function highlight(text, term) {
    const regex = new RegExp(`(${term})`, "gi");
    return text.replace(regex, `<span class='text-danger'>$1</span>`)
}


function findInName(item, term) {
    return item.name.toLowerCase().includes(term.toLowerCase())
}

function findInSlot(item, filters) {
    if (filters.length === 0) return true

    return filters.includes(item.details.slot)
}

function findInType(item, filters) {
    if (filters.length === 0) return true

    return filters.includes(item.details.type)
}

function findBySchool(item, filters) {
    if (filters.length === 0) return true

    return filters.includes(item.details.school)
}

function findByClass(item, filters) {
    if (filters.length === 0) return true
    if (!item.details.level) return false
    for (const filter of filters) {
        if (item.details.level.includes(filter)) return true
    }
    return false
}

function findInDesc(item, term) {
    return item.details.description.toLowerCase().includes(term.toLowerCase())
}

function resetSearch() {
    elem('Search_Item').value = ''
    elem('search_spell_wrapper').innerHTML = ''
    elem('search_w_item_wrapper').innerHTML = ''
    elem('footer').style.display='none'
}









//========================================
// Crafting Calculation
//========================================





function isInt(formValue) {
    return !isNaN(formValue) && parseInt(formValue) == formValue;
}

function resetState() {
    for (var i = 0; i < boxes.length; ++i) {
        elem(boxes[i]).style.backgroundColor = baseColor;
    }
    elem("Progress").value = "";
    elem("TotalProgress").value = "";
    elem("TimeTaken").value = "";
    elem("AmountToPay").value = "";
    }

    function setItemCountState() {
    var itemMultElem = elem("ItemMultiple");
    var isMaster = elem("IsMaster");
    if (isMaster.checked) {
        itemMultElem.disabled = false;
    } else {
        itemMultElem.disabled = true;
        itemMultElem.value = "1";
    }
}

function getValues() {
    var values = {};
    var hasError = false;
    for (var i = 0; i < boxes.length; ++i) {
        var value = val(boxes[i]);
        if (!isInt(value) || parseInt(value) < 0) {
        elem(boxes[i]).style.backgroundColor = errorColor;
        hasError = true;
        continue;
        }
        value = parseInt(value);
        values[boxes[i]] = value;
    }

    if (hasError) {
        return;
    }
    for (var i = 0; i < bools.length; ++i) {
        values[bools[i]] = elem(bools[i]).checked;
    }
    if (values["GP"] == 0 && values["SP"] == 0 && values["CP"] == 0) {
        elem("GP").style.backgroundColor = errorColor;
        elem("SP").style.backgroundColor = errorColor;
        elem("CP").style.backgroundColor = errorColor;
        return;
    }
    return values;
}

function computeWorkNeeded(values) {
    if (values["IsMaster"]) {
        values["WorkNeeded"] = values["GP"];
    } else {
        values["WorkNeeded"] = values["GP"] * 10 + values["SP"];
    }
    if (values["IsSwift"]) {
        values["WorkNeeded"] = parseInt(values["WorkNeeded"] / 2);
    }
    if (values["WorkNeeded"] < 1) {
        values["WorkNeeded"] = 1;
    }
    }

    function multiplyCost(cost, multiple) {
    var cpCost = parseInt((cost["GP"] || 0) * 100 +
                            (cost["SP"] || 0) * 10 +
                            (cost["CP"] || 0));
    cost["CP"] = parseInt(cpCost * multiple);
    cost["SP"] = 0;
    cost["GP"] = 0;
    normalizeCost(cost);
}

function addCosts(cost, newCost) {
    cost["GP"] = cost["GP"] + newCost["GP"];
    cost["SP"] = cost["SP"] + newCost["SP"];
    cost["CP"] = cost["CP"] + newCost["CP"];
    normalizeCost(cost);
    }

    function normalizeCost(cost) {
    if (cost["CP"] > 10) {
        cost["SP"] += parseInt(cost["CP"] / 10);
        cost["CP"] = parseInt(cost["CP"] % 10);
    }
    if (cost["SP"] > 10) {
        cost["GP"] += parseInt(cost["SP"] / 10);
        cost["SP"] = parseInt(cost["SP"] % 10);
    } 
}

function setStatus(values) {
    // Set progress
    if (values["TotalWorkDone"] >= values["WorkNeeded"]) {
        var extraWork = values["TotalWorkDone"] - values["WorkNeeded"];
        var workDone = values["WorkDone"] - extraWork;
        var percentWorkDone = parseInt(100 * workDone / values["WorkNeeded"]);
        elem("Progress").value = percentWorkDone + "% Progress (" + workDone + ")";
        elem("TotalProgress").value = "100% Complete (" + values["WorkNeeded"]
            + "/" + values["WorkNeeded"] + ")";
    } else {
        var percentWorkDone = parseInt(100 * values["WorkDone"] / values["WorkNeeded"]);
        elem("Progress").value = percentWorkDone + "% Progress (" + values["WorkDone"] + ")";
        var percentComplete = parseInt(100 * values["TotalWorkDone"] / values["WorkNeeded"]);
        elem("TotalProgress").value = percentComplete + "% Complete (" + values["TotalWorkDone"]
            + "/" + values["WorkNeeded"] + ")";
    }
    var timeTaken = values["TimeTaken"];
    var weeks = timeTaken["Weeks"];
    var weeksStr = (weeks > 0) ? (weeks + " week" + (weeks > 1 ? "s" : "")) : "";
    var days = timeTaken["Days"];
    var daysStr = (days == 0 && weeks > 0) ? "" : (days + " day" + (days == 1 ? "" : "s"));
    elem("TimeTaken").value = weeksStr + (weeksStr == "" || daysStr == "" ? "" : ", ") + daysStr + " | Hours: " + parseInt(days * 20);
    var cost = values["Cost"];
    var costStr = "";
    if (cost["GP"] == 0 && cost["SP"] == 0 && cost["CP"] == 0) {
        costStr = "0 GP";
    } else {
        if (cost["GP"] > 0) {
        costStr = cost["GP"] + " GP";
        }
        if (cost["SP"] > 0) {
        var spStr = cost["SP"] + " SP";
        costStr += costStr == "" ? spStr : ", " + spStr;
        }
        if (cost["CP"] > 0) {
        var cpStr = cost["CP"] + " CP";
        costStr += costStr == "" ? cpStr : ", " + cpStr;
        }
    }
    elem("AmountToPay").value = costStr;
}

function computeTimeTaken(values) {
    if (values["PriorWork"] >= values["WorkNeeded"]) {
        // We were already done
        values["TimeTaken"] = { "Weeks": 0, "Days": 0 };
        return;
    }
    var baseTime = {
        "Weeks": (values["IsByDay"] ? 0 : 1),
        "Days": (values["IsByDay"] ? 1 : 0),
    };
    values["TimeTaken"] = baseTime;
    if (values["TotalWorkDone"] <= values["WorkNeeded"]) {
        // We're not done, or we used exactly all our effort
        return;
    }
    // It didn't take us the full amount of time to finish
    var remainingWork = values["WorkNeeded"] - values["PriorWork"];
    var fractionEffortUsed = remainingWork / values["WorkDone"];
    var daysUsed = fractionEffortUsed * (baseTime["Weeks"] * 7 + baseTime["Days"]);
    if (daysUsed > 7) {
        // This pretty much can't happen, but for completeness...
        baseTime["Weeks"] = parseInt(daysUsed / 7);
        baseTime["Days"] = (daysUsed % 7).toFixed(1);
    } else {
        baseTime["Weeks"] = 0;
        baseTime["Days"] = parseFloat(daysUsed.toFixed(3));
    }
}

function recompute() {
    resetState();
    var values = getValues();
    console.log(values)

    if (!values) {
        return;
    }
    // Normalize user inputs
    normalizeCost(values);
    elem("GP").value = values["GP"];
    elem("SP").value = values["SP"];
    elem("CP").value = values["CP"];
    computeWorkNeeded(values);
    if (values["PriorWork"] >= values["WorkNeeded"]) {
        // We're already done...
        values["WorkDone"] = 0;
        values["TotalWorkDone"] = values["WorkNeeded"];
        values["Cost"] = { "GP": 0, "SP": 0, "CP": 0 };
    } else {
        if (values["PriorWork"] > 0) {
        values["Cost"] = { "GP": 0, "SP": 0, "CP": 0 };
        } else {
        values["Cost"] = { "GP": values["GP"], "SP": values["SP"], "CP": values["CP"] };
        multiplyCost(values["Cost"], values["ItemMultiple"] / 3);
        }
        if (values["Check"] < values["DC"]) {
        // Check if failed check by 5 or more
        if (values["DC"] - values["Check"] >= 5) {
            // Repay half base material cost
            var addedCost = { "GP": values["GP"], "SP": values["SP"], "CP": values["CP"] };
            if (values["IsByDay"]) {
            // Half cost (1/6th base cost) divided by 7 for 1 day fraction
            multiplyCost(addedCost, values["ItemMultiple"] / 42);
            } else {
            // Half cost (1/6th base cost)
            multiplyCost(addedCost, values["ItemMultiple"] / 6);
            }
            console.log(addedCost);
            addCosts(values["Cost"], addedCost);
        }
        // No work done
        values["WorkDone"] = 0;
        } else {
        values["WorkDone"] = values["Check"] * values["DC"];
        if (values["IsByDay"]) {
            values["WorkDone"] = parseInt(values["WorkDone"] / 7);
        }
        }
        values["TotalWorkDone"] = values["PriorWork"] + values["WorkDone"];
    }
    computeTimeTaken(values);
    console.log(values);
    setStatus(values);
}