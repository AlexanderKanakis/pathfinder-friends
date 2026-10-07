function elem(name) {
  return document.getElementById(name);
}

function val(name) {
  return elem(name).value;
}

var errorColor = "#5f2323";
var baseColor = "#2b2b2b";
var boxes = ["DC", "GP", "SP", "CP", "PriorWork", "Check", "ItemMultiple"];
var bools = ["IsMaster", "IsSwift", "IsByDay"];

function loadSelect() {
  var sel = elem("Item");
  for (var i = 0; i < items.length; ++i) {
    sel.options[sel.options.length] = new Option(items[i]["name"], i);
  }
  sel.options[1].selected = true;
  loadItem();
}

function loadItem() {
  var sel = elem("Item");
  var selectedOption = sel.options[sel.selectedIndex];
  var item = items[selectedOption.value];
  if (!item["dc"]) {
    // Placeholder item
    return;
  }
  var itemNameElem = elem("ItemName");
  itemNameElem.innerHTML =
    '<a href="' +
    item["link"] +
    '" target="_blank">' +
    item["name"] +
    " (DC " +
    item["dc"] +
    ")</a>";
  var itemDesc = elem("Description");
  var description = "";
  if (item["desc"]) {
    // Normal item
    for (var i = 0; i < item["desc"].length; ++i) {
      description += "<p>" + item["desc"][i] + "</p>";
    }
  } else if (item["addiction"]) {
    // Drug
    description = drugDesc(item);
  } else {
    // Poison
    description = poisonDesc(item);
  }
  itemDesc.innerHTML = description;
  elem("DC").value = item["dc"];
  elem("GP").value = item["gp"] || 0;
  elem("SP").value = item["sp"] || 0;
  elem("CP").value = item["cp"] || 0;
}

function drugDesc(item) {
  var desc = "";
  if (item["flavor"]) {
    for (var i = 0; i < item["flavor"].length; ++i) {
      desc += "<p>" + item["flavor"][i] + "</p>";
    }
  } else {
    desc += "<br/>";
  }
  desc += "<b>Type</b> drug (" + item["type"] + "); ";
  desc +=
    "<b>Addiction</b> " +
    item["addiction"] +
    ", Foritude DC " +
    item["dc"] +
    "<br/>";
  for (var i = 0; i < item["effect"].length; ++i) {
    desc += (i > 0 ? "; " : "") + "<b>Effect</b> " + item["effect"][i];
  }
  desc += item["damage"] ? "<br/><b>Damage</b> " + item["damage"] : "";
  return desc;
}

function poisonDesc(item) {
  var desc = "<br/><b>Type</b> poison (" + item["type"] + "); <b>Save</b> ";
  desc += "Fortitude DC " + item["dc"] + "<br/>";
  desc += item["onset"]
    ? "<b>Onset</b> " + item["onset"] + (item["freq"] ? "; " : "")
    : "";
  desc += (item["freq"] ? "<b>Frequency</b> " + item["freq"] : "") + "<br/>";
  desc +=
    "<b>" +
    (item["secondary"] ? "Initial " : "") +
    "Effect</b> " +
    item["effect"];
  desc += item["secondary"]
    ? "; <b>Secondary Effect</b> " + item["secondary"]
    : "";
  desc += item["cure"] ? "; <b>Cure</b> " + item["cure"] : "";
  return desc;
}

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
  var cpCost = parseInt(
    (cost["GP"] || 0) * 100 + (cost["SP"] || 0) * 10 + (cost["CP"] || 0),
  );
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
    var percentWorkDone = parseInt((100 * workDone) / values["WorkNeeded"]);
    elem("Progress").value = percentWorkDone + "% Progress (" + workDone + ")";
    elem("TotalProgress").value =
      "100% Complete (" +
      values["WorkNeeded"] +
      "/" +
      values["WorkNeeded"] +
      ")";
  } else {
    var percentWorkDone = parseInt(
      (100 * values["WorkDone"]) / values["WorkNeeded"],
    );
    elem("Progress").value =
      percentWorkDone + "% Progress (" + values["WorkDone"] + ")";
    var percentComplete = parseInt(
      (100 * values["TotalWorkDone"]) / values["WorkNeeded"],
    );
    elem("TotalProgress").value =
      percentComplete +
      "% Complete (" +
      values["TotalWorkDone"] +
      "/" +
      values["WorkNeeded"] +
      ")";
  }
  var timeTaken = values["TimeTaken"];
  var weeks = timeTaken["Weeks"];
  var weeksStr = weeks > 0 ? weeks + " week" + (weeks > 1 ? "s" : "") : "";
  var days = timeTaken["Days"];
  var daysStr =
    (days == 0 && weeks > 0) || (days == 0 && weeks === 0)
      ? ""
      : days + " day" + (days == 1 ? "" : "s");
  var hours = timeTaken["Hours"] || days * 24;
  var minutes = timeTaken["Minutes"];
  var minStr =
    minutes > 0 ? " Minute" + (minutes > 1 ? "s: " : ": ") + minutes : "";
  elem("TimeTaken").value =
    weeksStr +
    (weeksStr == "" || daysStr == "" ? "" : ", ") +
    daysStr +
    (hours > 0 ? " | " : "") +
    (hours > 0 ? "Hours: " + hours.toFixed(1) : "") +
    (minutes > 0 ? ` | ${minStr}` : "");
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

  const highSuccesTimeDivider = Math.floor(
    (values["Check"] * values["DC"]) / values["WorkNeeded"],
  );
  var craftCalc = elem("CraftCalc");
  if (craftCalc) {
    craftCalc.innerHTML = `
                    <ul class="list-group">
                        <li class="list-group-item">
                            <b>WorkNeeded:</b> ${values["WorkNeeded"]}
                        </li>
                        <li class="list-group-item">
                            <b>Check*DC:</b> ${values["Check"] * values["DC"]}
                        </li>
                        <li class="list-group-item">
                            ${highSuccesTimeDivider > 1 ? `<b>TimeMult:</b> ${highSuccesTimeDivider}` : ""}
                        </li>
                    </ul/
                    `;
  }
}

function computeTimeTaken(values) {
  if (values["PriorWork"] >= values["WorkNeeded"]) {
    // We were already done
    values["TimeTaken"] = { Weeks: 0, Days: 0 };
    return;
  }
  var baseTime = {
    Weeks: values["IsByDay"] ? 0 : 1,
    Days: values["IsByDay"] ? 1 : 0,
  };
  values["TimeTaken"] = baseTime;
  if (values["TotalWorkDone"] <= values["WorkNeeded"]) {
    // We're not done, or we used exactly all our effort
    return;
  }
  // It didn't take us the full amount of time to finish
  var remainingWork = values["WorkNeeded"] - values["PriorWork"];
  var fractionEffortUsed = remainingWork / values["WorkDone"];
  var daysUsed =
    fractionEffortUsed * (baseTime["Weeks"] * 7 + baseTime["Days"]);
  if (daysUsed > 7) {
    // This pretty much can't happen, but for completeness...
    baseTime["Weeks"] = parseInt(daysUsed / 7);
    baseTime["Days"] = (daysUsed % 7).toFixed(1);
    baseTime["Hours"] = parseFloat(((daysUsed % 7) * 24).toFixed(1));
  } else {
    baseTime["Weeks"] = 0;
    baseTime["Days"] = parseFloat(daysUsed.toFixed(1));
    baseTime["Hours"] = parseFloat((daysUsed * 24).toFixed(1));
    if (baseTime["Days"] === 0) {
      baseTime["Minutes"] = Math.floor(daysUsed * 1440);
    }
  }
}

function recompute() {
  resetState();
  var values = getValues();
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
    values["Cost"] = { GP: 0, SP: 0, CP: 0 };
  } else {
    if (values["PriorWork"] > 0) {
      values["Cost"] = { GP: 0, SP: 0, CP: 0 };
    } else {
      values["Cost"] = { GP: values["GP"], SP: values["SP"], CP: values["CP"] };
      multiplyCost(values["Cost"], values["ItemMultiple"] / 3);
    }
    if (values["Check"] < values["DC"]) {
      // Check if failed check by 5 or more
      if (values["DC"] - values["Check"] >= 5) {
        // Repay half base material cost
        var addedCost = {
          GP: values["GP"],
          SP: values["SP"],
          CP: values["CP"],
        };
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

function searchItem() {
  const wrapper = elem("search_wrapper");
  wrapper.innerHTML = "";
  const term = val("Search_Item").trim();

  elem("footer").style.display = "flex";
  wrapper.style.display = "block";
  const matchingItems = items.filter(
    (item) =>
      item.dc && (!term || findInName(item, term) || findInDesc(item, term)),
  );
  const filteredItems = term ? matchingItems.slice(0, 60) : matchingItems;

  if (!filteredItems.length) {
    wrapper.innerHTML = `<div class="small text-secondary">No matching alchemical items found.</div>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "search-results-grid";
  for (const filteredItem of filteredItems) {
    const itemUnit = document.createElement("button");
    itemUnit.type = "button";
    itemUnit.className = "search-result-card";
    itemUnit.onclick = () => selectSearchItem(filteredItem);
    itemUnit.innerHTML = `
                    <span class="item-type-icon" title="${escapeHtml(searchItemType(filteredItem))}">
                        <i class="bi ${searchItemIcon(filteredItem)}"></i>
                    </span>
                    <div class="fw-semibold pe-2">${highlight(filteredItem.name, term)}</div>
                    <div class="small-text mb-2">DC ${filteredItem.dc} | Cost ${filteredItem.gp || 0} gp</div>
                    <div class="search-snippet">${highlight(itemSearchText(filteredItem), term)}</div>
                `;
    grid.appendChild(itemUnit);
  }
  wrapper.appendChild(grid);
}

function selectSearchItem(item) {
  elem("Item").selectedIndex = items.findIndex(
    (candidate) => candidate.name === item.name,
  );
  loadItem();
  resetSearch();
}

function searchItemType(item) {
  if (item.addiction) return "Drug";
  if (
    item.cure ||
    item.secondary ||
    String(item.type || "")
      .toLowerCase()
      .includes("poison")
  )
    return "Poison";
  return "Alchemical Item";
}

function searchItemIcon(item) {
  const type = searchItemType(item);
  if (type === "Drug") return "bi-capsule";
  if (type === "Poison") return "bi-droplet";
  return "bi-flask";
}

function highlight(text, term) {
  if (!term) return escapeHtml(text);
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedTerm})`, "gi");
  return escapeHtml(text).replace(regex, `<span class='text-danger'>$1</span>`);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function findInName(item, term) {
  return item.name.toLowerCase().includes(term.toLowerCase());
}

function findInDesc(item, term) {
  return itemSearchText(item).toLowerCase().includes(term.toLowerCase());
}

function itemSearchText(item) {
  return [
    ...(item.desc || []),
    ...(item.flavor || []),
    ...(item.effect || []),
    item.damage || "",
    item.addiction || "",
    item.type || "",
  ].join(" ");
}

function resetSearch(clearInput = true) {
  if (clearInput) elem("Search_Item").value = "";
  elem("search_wrapper").innerHTML = "";
  elem("search_wrapper").style.display = "none";
  elem("footer").style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = elem("Search_Item");
  searchInput.addEventListener("input", searchItem);
  searchInput.addEventListener("focus", searchItem);
  searchInput.addEventListener("click", () => {
    if (elem("search_wrapper").style.display !== "block") searchItem();
  });
});
