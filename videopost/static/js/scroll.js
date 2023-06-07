$(function() {
  // スクロールスナップの対象となるセクションを取得
  var container = $('.infinite-container')
  var currentSection = 0;
  var sections = $('.infinite-item').map(function() {
    return $(this).offset().top;
  }).get();

  // wheelイベントにデバウンスを適用する
  container.on('wheel', _.debounce(scrolling, 200))
  container.on('touchmove', _.debounce(scrolling, 200))
    
    function scrolling(e) {
    console.log(e.originalEvent.deltaY)
    // マウスホイールの方向に応じてスクロールするセクションを決定
    if (e.originalEvent.deltaY > 0 && currentSection < sections.length - 1) {
      currentSection++;
    } else if (e.originalEvent.deltaY < 0 && currentSection > 0) {
      currentSection--;
    }
    console.log(sections)
    console.log(currentSection)
    console.log(sections[currentSection])

    // 対象のセクションまでスクロール
    container.animate({
      scrollTop: sections[currentSection]
    },400,"swing");
  }; // デバウンスの時間は200ミリ秒に設定しています
  
});