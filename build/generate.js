// 玉环黄页 - 页面生成器 (Node.js, UTF-8 native)
const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const meta = data.meta;
const tplFactory = fs.readFileSync(path.join(__dirname, 'tpl_factory.html'), 'utf8');
const tplList = fs.readFileSync(path.join(__dirname, 'tpl_list.html'), 'utf8');
const dot = '·';
const sep = ' ' + dot + ' ';

const factoryByFile = {};
data.factories.forEach(f => { factoryByFile[f.file] = f; });

function makeBadges(f) { return f.badges.map(b => '<span class="badge">' + b + '</span>').join(''); }
function makeInfoBoxes(f) {
  return Object.keys(f.info).map(k => '<div class="info-box"><div class="k">' + k + '</div><div class="v">' + f.info[k] + '</div></div>').join('');
}
function makeProducts(f) {
  return f.products.map(p => {
    const spec = p.spec ? sep + p.spec : '';
    return '<div class="p"><b>' + p.name + '</b> ' + sep + ' ' + p.mat + spec + '</div>';
  }).join('');
}
function makeFaqs(arr) {
  if (!arr || !arr.length) return '<p class="no-results">' + meta.placeholder + '</p>';
  return arr.map(q => '<div class="faq-item"><h3>' + q.q + '</h3><p>' + q.a + '</p></div>').join('');
}
function makeRelated(arr) {
  if (!arr || !arr.length) return '<a href="/#join">厂家免费入驻</a>';
  return arr.map(r => '<a href="' + r.url + '">' + r.name + '</a>').join(sep);
}
function makeFactoryCard(f) {
  const tags = f.badges.slice(0, 4).map(b => '<span>' + b + '</span>').join('');
  return '<div class="factory">' +
    '<div class="f-top"><h3>' + f.name + '</h3><span class="town">' + f.town + '</span></div>' +
    '<p class="f-desc">' + f.sub + '</p>' +
    '<div class="f-tags">' + tags + '</div>' +
    '<div class="f-foot"><span class="tel">' + f.tel + '</span><a class="more" href="/' + f.file + '">查看详情</a></div>' +
  '</div>';
}
function buildFactoryLd(f) {
  const offers = f.products.map(p => ({ '@type': 'Product', 'name': p.name, 'material': p.mat, 'category': p.name, 'brand': f.name }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': f.name,
    'description': f.intro,
    'address': { '@type': 'PostalAddress', 'addressLocality': f.town, 'addressRegion': meta.province, 'streetAddress': f.address, 'postalCode': '317608' },
    'telephone': f.tel,
    'areaServed': meta.areaServed,
    'foundingDate': f.foundingDate,
    'knowsAbout': meta.knowsAbout,
    'makesOffer': offers,
    'contactPoint': { '@type': 'ContactPoint', 'telephone': f.tel, 'contactType': meta.contactType, 'availableLanguage': meta.lang }
  });
}
function buildListLd(name, desc, factories) {
  const items = factories.map((f, i) => ({ '@type': 'ListItem', 'position': i + 1, 'item': { '@type': 'LocalBusiness', 'name': f.name, 'url': 'https://xn--oby2cs85ktjf.com/' + f.file } }));
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', 'name': name, 'description': desc, 'itemListElement': items });
}

// factory pages
data.factories.forEach(f => {
  let html = tplFactory;
  html = html.replace(/__TITLE__/g, f.name + ' | 玉环黄页');
  html = html.replace(/__DESC__/g, f.intro.substring(0, Math.min(80, f.intro.length)));
  html = html.replace(/__CANONICAL__/g, 'https://xn--oby2cs85ktjf.com/' + f.file);
  html = html.replace(/__LDJSON__/g, buildFactoryLd(f));
  html = html.replace(/__CRUMB_TOWN__/g, f.town);
  html = html.replace(/__CRUMB_TOWN_URL__/g, f.townUrl);
  html = html.replace(/__NAME__/g, f.name);
  html = html.replace(/__SUB__/g, f.sub);
  html = html.replace(/__BADGES__/g, makeBadges(f));
  html = html.replace(/__INFOBOXES__/g, makeInfoBoxes(f));
  html = html.replace(/__PRODUCTS__/g, makeProducts(f));
  html = html.replace(/__INTRO__/g, f.intro);
  html = html.replace(/__CAPABILITY__/g, f.capability);
  html = html.replace(/__FAQS__/g, makeFaqs(f.faqs));
  html = html.replace(/__RELATED__/g, makeRelated(f.related));
  html = html.replace(/__TEL__/g, f.tel);
  html = html.replace(/__WECHAT__/g, f.wechat);
  html = html.replace(/__ADDRESS__/g, f.address);
  const out = path.join(base, f.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
  console.log('OK factory: ' + f.file);
});

// list pages
function genList(obj, kind) {
  const tpl = tplList;
  let cards = '';
  const factories = [];
  if (!obj.factoryFiles || obj.factoryFiles.length === 0) {
    cards = '<p class="no-results">' + meta.placeholder + '</p>';
  } else {
    obj.factoryFiles.forEach(ff => {
      if (factoryByFile[ff]) {
        factories.push(factoryByFile[ff]);
        cards += makeFactoryCard(factoryByFile[ff]);
      }
    });
    if (!cards) cards = '<p class="no-results">' + meta.placeholder + '</p>';
  }
  let html = tpl;
  html = html.replace(/__TITLE__/g, obj.name + ' | 玉环黄页');
  html = html.replace(/__DESC__/g, obj.sub + ' 收录玉环本地源头工厂联系方式。');
  html = html.replace(/__CANONICAL__/g, 'https://xn--oby2cs85ktjf.com/' + obj.file);
  html = html.replace(/__LDJSON__/g, buildListLd(obj.name, obj.sub, factories));
  html = html.replace(/__CRUMB__/g, meta.listCrumb[kind]);
  html = html.replace(/__NAME__/g, obj.name);
  html = html.replace(/__SUB__/g, obj.sub);
  html = html.replace(/__INTRO__/g, obj.intro ? obj.intro : obj.sub);
  html = html.replace(/__LIST_TITLE__/g, meta.listTitle[kind]);
  html = html.replace(/__FACTORY_CARDS__/g, cards);
  html = html.replace(/__FAQS__/g, obj.faqs ? makeFaqs(obj.faqs) : ('<p class="no-results">' + meta.placeholder + '</p>'));
  html = html.replace(/__RELATED__/g, obj.related ? makeRelated(obj.related) : '<a href="/#join">厂家免费入驻</a>');
  const out = path.join(base, obj.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
  console.log('OK list: ' + obj.file);
}

data.products.forEach(p => genList(p, 'product'));
data.towns.forEach(t => genList(t, 'town'));
data.industries.forEach(i => genList(i, 'industry'));

console.log('ALL DONE');
