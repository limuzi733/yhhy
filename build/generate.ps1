# 玉环黄页 - 页面生成器 (ASCII only; Chinese comes from UTF-8 data.json / templates)
$ErrorActionPreference = "Stop"
$base = Resolve-Path (Join-Path $PSScriptRoot "..")
$data = Get-Content (Join-Path $PSScriptRoot "data.json") -Encoding UTF8 -Raw | ConvertFrom-Json
$meta = $data.meta
$tplFactory = Get-Content (Join-Path $PSScriptRoot "tpl_factory.html") -Encoding UTF8 -Raw
$tplList = Get-Content (Join-Path $PSScriptRoot "tpl_list.html") -Encoding UTF8 -Raw
$dot = [char]0x00B7
$sep = " $dot "

$factoryByFile = @{}
foreach ($f in $data.factories) { $factoryByFile[$f.file] = $f }

function MakeBadges($f) {
  ($f.badges | ForEach-Object { '<span class="badge">' + $_ + '</span>' }) -join ""
}
function MakeInfoBoxes($f) {
  $out = @()
  foreach ($p in $f.info.PSObject.Properties) {
    $out += '<div class="info-box"><div class="k">' + $p.Name + '</div><div class="v">' + $p.Value + '</div></div>'
  }
  $out -join ""
}
function MakeProducts($f) {
  $out = @()
  foreach ($p in $f.products) {
    $spec = if ($p.spec) { " $sep " + $p.spec } else { "" }
    $out += '<div class="p"><b>' + $p.name + '</b> ' + $sep + ' ' + $p.mat + $spec + '</div>'
  }
  $out -join ""
}
function MakeFaqs($arr) {
  $out = @()
  foreach ($q in $arr) {
    $out += '<div class="faq-item"><h3>' + $q.q + '</h3><p>' + $q.a + '</p></div>'
  }
  $out -join ""
}
function MakeRelated($arr) {
  ($arr | ForEach-Object { '<a href="' + $_.url + '">' + $_.name + '</a>' }) -join " $sep "
}
function MakeFactoryCard($f) {
  $tags = ($f.badges | Select-Object -First 4 | ForEach-Object { '<span>' + $_ + '</span>' }) -join ""
  '<div class="factory">' +
    '<div class="f-top"><h3>' + $f.name + '</h3><span class="town">' + $f.town + '</span></div>' +
    '<p class="f-desc">' + $f.sub + '</p>' +
    '<div class="f-tags">' + $tags + '</div>' +
    '<div class="f-foot"><span class="tel">' + $f.tel + '</span><a class="more" href="/' + $f.file + '">查看详情</a></div>' +
  '</div>'
}
function BuildFactoryLd($f) {
  $offers = @()
  foreach ($p in $f.products) {
    $offers += @{ "@type"="Product"; "name"=$p.name; "material"=$p.mat; "category"=$p.name; "brand"=$f.name }
  }
  $ld = @{
    "@context"="https://schema.org";
    "@type"="LocalBusiness";
    "name"=$f.name;
    "description"=$f.intro;
    "address"=@{ "@type"="PostalAddress"; "addressLocality"=$f.town; "addressRegion"=$meta.province; "streetAddress"=$f.address; "postalCode"="317608" };
    "telephone"=$f.tel;
    "areaServed"=$meta.areaServed;
    "foundingDate"=$f.foundingDate;
    "knowsAbout"=$meta.knowsAbout;
    "makesOffer"=$offers;
    "contactPoint"=@{ "@type"="ContactPoint"; "telephone"=$f.tel; "contactType"=$meta.contactType; "availableLanguage"=$meta.lang }
  }
  ConvertTo-Json $ld -Depth 6 -Compress
}
function BuildListLd($name, $desc, $factories) {
  $items = @()
  $i = 1
  foreach ($f in $factories) {
    $items += @{ "@type"="ListItem"; "position"=$i; "item"=@{ "@type"="LocalBusiness"; "name"=$f.name; "url"="https://xn--oby2cs85ktjf.com/" + $f.file } }
    $i++
  }
  $ld = @{ "@context"="https://schema.org"; "@type"="ItemList"; "name"=$name; "description"=$desc; "itemListElement"=$items }
  ConvertTo-Json $ld -Depth 6 -Compress
}

# ===== generate factory pages =====
foreach ($f in $data.factories) {
  $html = $tplFactory
  $html = $html -replace "__TITLE__"          , ($f.name + " | 玉环黄页")
  $html = $html -replace "__DESC__"           , $f.intro.Substring(0, [Math]::Min(80, $f.intro.Length))
  $html = $html -replace "__CANONICAL__"      , ("https://xn--oby2cs85ktjf.com/" + $f.file)
  $html = $html -replace "__LDJSON__"         , (BuildFactoryLd $f)
  $html = $html -replace "__CRUMB_TOWN__"     , $f.town
  $html = $html -replace "__CRUMB_TOWN_URL__" , $f.townUrl
  $html = $html -replace "__NAME__"           , $f.name
  $html = $html -replace "__SUB__"            , $f.sub
  $html = $html -replace "__BADGES__"         , (MakeBadges $f)
  $html = $html -replace "__INFOBOXES__"      , (MakeInfoBoxes $f)
  $html = $html -replace "__PRODUCTS__"       , (MakeProducts $f)
  $html = $html -replace "__INTRO__"          , $f.intro
  $html = $html -replace "__CAPABILITY__"     , $f.capability
  $html = $html -replace "__FAQS__"           , (MakeFaqs $f.faqs)
  $html = $html -replace "__RELATED__"        , (MakeRelated $f.related)
  $html = $html -replace "__TEL__"            , $f.tel
  $html = $html -replace "__WECHAT__"         , $f.wechat
  $html = $html -replace "__ADDRESS__"        , $f.address
  $out = Join-Path $base $f.file
  New-Item -ItemType File -Path $out -Force | Out-Null
  Set-Content -Path $out -Value $html -Encoding UTF8
  Write-Host ("OK factory: " + $f.file)
}

# ===== generate list pages (product / town / industry) =====
function GenList($obj, $kind) {
  $tpl = Get-Content (Join-Path $PSScriptRoot "tpl_list.html") -Encoding UTF8 -Raw
  $cards = ""
  $factories = @()
  if ($obj.factoryFiles.Count -eq 0) {
    $cards = '<p class="no-results">' + $meta.placeholder + '</p>'
  } else {
    foreach ($ff in $obj.factoryFiles) {
      if ($factoryByFile.ContainsKey($ff)) {
        $factories += $factoryByFile[$ff]
        $cards += (MakeFactoryCard $factoryByFile[$ff])
      }
    }
    if (-not $cards) { $cards = '<p class="no-results">' + $meta.placeholder + '</p>' }
  }
  $crumb = $meta.listCrumb.$kind
  $listTitle = $meta.listTitle.$kind
  $html = $tpl
  $html = $html -replace "__TITLE__"         , ($obj.name + " | 玉环黄页")
  $html = $html -replace "__DESC__"          , ($obj.sub + " 收录玉环本地源头工厂联系方式。")
  $html = $html -replace "__CANONICAL__"     , ("https://xn--oby2cs85ktjf.com/" + $obj.file)
  $html = $html -replace "__LDJSON__"        , (BuildListLd $obj.name $obj.sub $factories)
  $html = $html -replace "__CRUMB__"         , $crumb
  $html = $html -replace "__NAME__"          , $obj.name
  $html = $html -replace "__SUB__"           , $obj.sub
  $html = $html -replace "__INTRO__"         , $obj.intro
  $html = $html -replace "__LIST_TITLE__"    , $listTitle
  $html = $html -replace "__FACTORY_CARDS__" , $cards
  $html = $html -replace "__FAQS__"          , (MakeFaqs $obj.faqs)
  $html = $html -replace "__RELATED__"       , (MakeRelated $obj.related)
  $out = Join-Path $base $obj.file
  New-Item -ItemType Directory -Path (Split-Path $out) -Force -ErrorAction SilentlyContinue | Out-Null
  New-Item -ItemType File -Path $out -Force | Out-Null
  Set-Content -Path $out -Value $html -Encoding UTF8
  Write-Host ("OK list: " + $obj.file)
}

foreach ($p in $data.products)   { GenList $p "product" }
foreach ($t in $data.towns)      { GenList $t "town" }
foreach ($i in $data.industries) { GenList $i "industry" }

Write-Host "ALL DONE"
