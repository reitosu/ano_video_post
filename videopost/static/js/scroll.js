$('body').addClass('no_scroll');

$(function() {
  // スクロールスナップの対象となるセクションを取得
  var container = $('.infinite-container')
  var currentSection = 0;

  // wheelイベントにデバウンスを適用する
  container.on('wheel', _.debounce(scrolling, 200))
  container.on('touchmove', _.debounce(scrolling, 200))
    
    function scrolling(e) {
    var sections = $('.infinite-item').map(function() {
      return $(this).offset().top;
    }).get();
    // マウスホイールの方向に応じてスクロールするセクションを決定
    if (e.originalEvent.deltaY > 0 && currentSection < sections.length - 1) {
      currentSection++;
    } else if (e.originalEvent.deltaY < 0 && currentSection > 0) {
      currentSection--;
    }
    console.log(currentSection)
    console.log(sections[currentSection]+container.scrollTop())

    // 対象のセクションまでスクロール
    container.animate({
      scrollTop: sections[currentSection]+container.scrollTop()
    },400,"swing");
  }; // デバウンスの時間は200ミリ秒に設定しています
  

  var page=2
  container.scroll(function(){
    var sections = $('.infinite-item').map(function() {
      return $(this).offset().top;
    }).get();
    if (Math.abs($(this).offset().top) == Math.abs(sections[sections.length-1])){
      loadvideo(page)
      page++
    }
  })
  
  function loadvideo(page){
    $.ajax({
      url: '?page='+page,
      type: 'GET',
    })
    .done(function (data) {
        var fragment = document.createRange().createContextualFragment(data);
        console.log(fragment.querySelector('#container'))
        $('#container').append(fragment.querySelectorAll('.infinite-item'));
      })
    }
  });