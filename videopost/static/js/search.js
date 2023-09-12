var tags = [
    "hou",
    "ren",
    "sou",
    "houchi",
    "renkyu",
    "soutai",
    "h",
    "r",
    "s"
  ];

  var dropdownMenu = document.getElementById("dropdown-menu");
  var tagList = document.getElementById("tag-list");

  function populateDropdownMenu(tags) {
    dropdownMenu.innerHTML = "";

    if (tags.length > 0) {
      tags.forEach(function(tag) {
        var listItem = document.createElement("li");
        listItem.textContent = tag;
        dropdownMenu.appendChild(listItem);
      });

      dropdownMenu.style.display = "block";
    } else {
      dropdownMenu.style.display = "none";
    }
  }

  function populateTagList(tags) {
    tagList.innerHTML = "";

    if (tags.length > 0) {
      tags.forEach(function(tag) {
        var listItem = document.createElement("li");
        listItem.textContent = tag;
        tagList.appendChild(listItem);
      });

      tagList.style.display = "block";
    } else {
      tagList.style.display = "none";
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById("search-input");
    var searchButton = document.getElementById("search-button");

    searchButton.addEventListener("click", function() {
      var searchText = searchInput.value.trim();

      if (searchText !== "") {
        var matchingTags = tags.filter(function(tag) {
          return tag.includes(searchText);
        });

        populateTagList(matchingTags);
      }
    });

    searchInput.addEventListener("input", function() {
      var searchText = searchInput.value.trim();

      if (searchText === "") {
        dropdownMenu.style.display = "none";
        dropdownMenu.innerHTML = "";
      } else {
        var matchingTags = tags.filter(function(tag) {
          return tag.includes(searchText);
        });

        populateDropdownMenu(matchingTags);
      }
    });
  });