/*
 * made by aliser
 * repo: https://github.com/murolem/cosmoteer-wiki-purge-page-button-gadget
*/

$(function() {
  var logPrefix = "purge-button";
  var className = "purge-btn";
  var actionResultDisplayDurationMs = 1e3;
  function purgeCurrentPage() {
    var pageUrlWithoutParams = window.location.href.split("?")[0];
    var purgeUrl = "".concat(pageUrlWithoutParams, "?action=purge");
    setPurgeButtonProgressState("in-progress");
    fetch(purgeUrl, {
      "method": "POST"
      // "credentials": "include"
    }).catch(function(err) {
      console.error("[".concat(logPrefix, "] purge failed (request error)!"));
      console.log(err);
      setPurgeButtonProgressState("done--failure");
    }).then(function(res) {
      if (res && res.ok) {
        console.log("[".concat(logPrefix, "] purge successful!"));
        setPurgeButtonProgressState("done--success");
      } else {
        console.error("[".concat(logPrefix, "] purge failed (no response/non-ok code)"));
        console.log(res);
        setPurgeButtonProgressState("done--failure");
      }
    });
  }
  var classByProgressState = {
    "none": "".concat(className, "--progress-state-none"),
    "in-progress": "".concat(className, "--progress-state-in-progress"),
    "done--success": "".concat(className, "--progress-state-success"),
    "done--failure": "".concat(className, "--progress-state-failure")
  };
  var navbarMoreButton = $("#p-cactions");
  var buttonList = navbarMoreButton.find("ul.vector-menu-content-list");
  var existingPurgeButtons = buttonList.children().toArray().filter(function(el) {
    var _a;
    return (_a = el.textContent) == null ? void 0 : _a.toLocaleLowerCase().includes("purge cache");
  });
  if (existingPurgeButtons.length > 0) {
    console.log("[".concat(logPrefix, "] found existing purge buttons (").concat(existingPurgeButtons.length, "), they will be removed: "), existingPurgeButtons);
    existingPurgeButtons.forEach(function(btn) {
      return btn.remove();
    });
  }
  var purgeButton = $('\n    <li class="'.concat(className, '--btn mw-list-item" style="\n    ">\n        <a title="Purge the page\'s cache. This will force all the page visitors to load the most recent version of the page.">\n            <span>Purge Cache</span>\n        </a>\n    </li>\n    '));
  purgeButton.find("a")[0].addEventListener("click", purgeCurrentPage);
  buttonList.append(purgeButton);
  var resultDisplayTimeoutHandle = void 0;
  var setPurgeButtonProgressState = function(state) {
    var setProgressStateClass = function(stateToAdd) {
      var classToAdd = classByProgressState[stateToAdd];
      var classesToRemove = Object.entries(classByProgressState).filter(function(entry) {
        return entry[0] !== stateToAdd;
      }).map(
        function(entry) {
          return entry[1];
        }
        /* class name */
      );
      purgeButton.addClass(classToAdd);
      purgeButton.removeClass(classesToRemove);
    };
    switch (state) {
      case "none":
        clearTimeout(resultDisplayTimeoutHandle);
        setProgressStateClass("none");
        break;
      case "in-progress":
        clearTimeout(resultDisplayTimeoutHandle);
        setProgressStateClass("in-progress");
        break;
      case "done--success":
        clearTimeout(resultDisplayTimeoutHandle);
        setProgressStateClass("done--success");
        resultDisplayTimeoutHandle = window.setTimeout(function() {
          return setPurgeButtonProgressState("none");
        }, actionResultDisplayDurationMs);
        break;
      case "done--failure":
        setProgressStateClass("done--failure");
        resultDisplayTimeoutHandle = window.setTimeout(function() {
          return setPurgeButtonProgressState("none");
        }, actionResultDisplayDurationMs);
        break;
      default:
        throw new Error("[".concat(logPrefix, "]unsupported progress state: ") + state);
    }
  };
});
