// 玉环黄页 - 前端实时搜索
(function () {
  var D = window.YH_DATA;
  if (!D) return;

  function buildIndex() {
    var idx = [];
    D.factories.forEach(function (f) {
      idx.push({
        type: "厂家", name: f.name, url: f.url,
        hay: (f.name + " " + f.town + " " + f.desc + " " + f.products.join(" ") + " " + f.materials.join(" ") + " " + f.industry).toLowerCase(),
        meta: f.town + " · " + f.industry,
        tags: f.products.slice(0, 3)
      });
    });
    D.products.forEach(function (p) {
      idx.push({
        type: "产品", name: p.name, url: p.url,
        hay: (p.name + " " + p.desc).toLowerCase(),
        meta: "产品分类", tags: []
      });
    });
    D.towns.forEach(function (t) {
      idx.push({
        type: "镇", name: t.name + "厂家", url: t.url,
        hay: (t.name + " 镇 厂家").toLowerCase(), meta: "按镇查找", tags: []
      });
    });
    D.industries.forEach(function (i) {
      idx.push({
        type: "行业", name: i.name + "厂家", url: i.url,
        hay: (i.name + " 行业 厂家").toLowerCase(), meta: "按行业查找", tags: []
      });
    });
    return idx;
  }

  var INDEX = buildIndex();

  function search(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return [];
    return INDEX.filter(function (it) { return it.hay.indexOf(q) !== -1; }).slice(0, 12);
  }

  function render(results, box) {
    if (!results.length) {
      box.innerHTML = '<div class="sr-empty">未找到匹配结果，换个关键词试试</div>';
      return;
    }
    box.innerHTML = results.map(function (r) {
      var tags = (r.tags || []).map(function (t) { return '<span class="tag">' + t + '</span>'; }).join("");
      return '<a class="sr-item" href="' + r.url + '">' +
        '<div class="name">[' + r.type + '] ' + r.name + '</div>' +
        '<div class="meta">' + r.meta + '</div>' + tags + '</a>';
    }).join("");
  }

  // 初始化所有搜索框
  function init(inputSel, boxSel) {
    var input = document.querySelector(inputSel);
    var box = document.querySelector(boxSel);
    if (!input || !box) return;

    function update() {
      var res = search(input.value);
      render(res, box);
      box.classList.add("show");
    }

    input.addEventListener("input", update);
    input.addEventListener("focus", function () { if (input.value) update(); });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove("show");
    });
    box.addEventListener("click", function (e) {
      if (e.target.closest("a")) box.classList.remove("show");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    init("#siteSearch", "#searchResults");
    init("#searchInput", "#pageSearchResults");
  });
})();
