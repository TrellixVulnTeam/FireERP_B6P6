var $_GET = [];
get = window.location.href.split('?');

var $_CAPS = ['Usuarios','Caixa','Produtos','Pedidos','Entregas','Configurações'];


if(typeof get[1] != 'undefined'){
    get = get[1];
    get = get.split('&');
    
    $.each(get, function(key, value){
        value = value.split('=');
        $_GET[value[0]] = value[1];
    });
}

Hammer(document.getElementsByTagName('body')[0]).on("swipe", function(event) {
  if(event.direction == 4){
    $('body').addClass('nav-visible');  
  }

  if(event.direction == 2){
    $('body').removeClass('nav-visible'); 
  }
});

firebase.initializeApp({
    ...
});

firebase.auth().useDeviceLanguage();
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
    $('#auth').attr('title','Sair: '+user.email).addClass('logado');
    $('#login').hide();

    firebase.database().ref("/_users/"+user.uid).on('value', function(snap) {
      $('nav header strong').html( snap.val().nome );

      for (var i in snap.val().caps) {
        $('[cap="'+i+'"]').style('display','block','important');
      }      
    });
  } else {
    $('#auth').attr('title','Entrar').removeClass('logado');
    $('#login').show();
  }
});

firebase.database().ref(".info/connected").on("value", function(snap) {
  if (snap.val() === true) {
    $('body').removeClass("offline");
  } else {
    $('body').addClass("offline");
  }
});

var $_CONFIG;
firebase.database().ref('/_config/').on('value', function(snap) {
  $_CONFIG = snap.val();
});

$(window)
.bind('keydown', function(event) {
    var key = String.fromCharCode(event.which).toLowerCase();
    if(event.which == 107) key = '+';
    if(event.which == 109) key = '-';


    if (event.ctrlKey || event.metaKey) {
      if($("[ctrl-key='"+key+"']").length >0){
        $("[ctrl-key='"+key+"']").click();
        return false;
      }                       
    } 

    if($("[key='"+key+"']").length >0){
      $("[key='"+key+"']").click();
      return false;
    }

    //esc
    if(event.which == 27){
      $('body').removeClass('nav-visible'); 
      $('.drop').hide(); 
    }

    //delete
    if(event.which == 46){
      if($('tr.selected').length > 0){

        $( "<div title='Tem certeza?'>Excluir "+$('tr.selected').length+" registro(s)?</div>" ).dialog({
          modal: true,
          buttons: {            
            Excluir: function() {
              $("tr.selected").each(function( index ) {
                ref = $(this).parent().parent().attr('ref')+$(this).attr('id');
 
                firebase.database().ref(ref).remove()
              }); 

              $(this).dialog( "close" );
            }
          }
        });

      }
    }                
}).resize(function() {
  $('nav section').css('height', $(window).outerHeight() - $('nav header').outerHeight());

  if($('[widthBy]').length > 0){
    $('[widthBy]').each(function( index ) {
      var width = 0;

      $($(this).attr('widthBy')).each(function( index ) {
        if(typeof $(this).attr('is_empty') == 'undefined' && $(this).is(':visible')){
          width += $(this).outerWidth();
        }
      });

      $(this).css('width',width);
    });
  }

  if($('[widthByScript]').length > 0){
    $('[widthByScript]').each(function( index ) {
      $(this).css('width', eval($(this).attr('widthByScript')) );
    });
  }  

  if($('[heightBy]').length > 0){
    $('[heightBy]').each(function( index ) {
      var height = 0;

      $($(this).attr('heightBy')).each(function( index ) {
        if(typeof $(this).attr('is_empty') == 'undefined' && $(this).is(':visible')){
          height += $(this).outerHeight();
        }
      });

      $(this).css('height',height);
    });
  }

  if($('[heightByScript]').length > 0){
    $('[heightByScript]').each(function( index ) {
      $(this).css('height', eval($(this).attr('heightByScript')) );
    });
  } 

  if($('[leftBy]').length > 0){
    $('[leftBy]').each(function( index ) {
      var offset = $($(this).attr('leftBy')).offset();

      $(this).css('left',offset.left);
    });
  }

  if($('[topBy]').length > 0){
    $('[topBy]').each(function( index ) {
      var offset = $($(this).attr('topBy')).offset();

      $(this).css('top',offset.top);
    });
  }  
}).resize();


/// LOAD BOOTSTRAP -----------------------------------------------------------------------------------------------------
function bootstrap(response, status, xhr) {
    $('main header h1').before('<a id="apps-menu" href="javascript:void(0);" class="fa fa-th drop-btn"></a><ul class="drop apps-menu"><li><a href="/calendario"><i class="fa fa-calendar"></i> Calendario</a></li></ul>');

    if ( status == "error" ) {
      $( "main" ).html( "<div style='text-align: center;font-size: 150%;padding: 50px;'><h1 style='margin: 0;'>Ops.. :(</h1><br />" + xhr.status + " " + xhr.statusText +"</div>");
      window.document.title = '404 - Onsize';
      return false;
    }

    window.document.title = $('main header h1').text() + ' - Onsize';

    $('nav ul li a').removeClass('selected');
    if($('nav ul li a[href="'+window.location.pathname+'"]').length > 0){
      $('nav ul li a[href="'+window.location.pathname+'"]').addClass('selected');
    }

    $('[validate="date"]').datepicker({
      language: 'pt-BR'
    });
    $('[validate="date"]').mask('00/00/0000');


    $('[ref][once]').once();
    $('input[ref][autocomplete]').once();

    //ATIVA ELEMENTOS COM ATRIBUTO ON
    if($('div[ref][on],ul[ref][on],p[ref][on],select[ref][on]').length > 0){   

      $("div[ref][on],ul[ref][on],p[ref][on],select[ref][on]").each(function( index ) {
        let obj = $(this);

        var ref = obj.attr('ref');

        ref = firebase.database().ref( ref );

        if(typeof obj.attr('orderBy') != 'undefined'){
          ref = ref.orderByChild(  obj.attr('orderBy')  );
        }

        ref.on('value', function(snapshot) {
          if(typeof obj.attr('filtered') == 'undefined'){
            $(obj).draw( snapshot );
          }
        }); 

        ref.on('child_changed', function(snapshot) {
            row_data = snapshot.val();
            row_data.key = snapshot.key;
                    
          $('#'+snapshot.key).render( row_data );
        });   
                 
        ref.on('child_removed', function(snapshot) {
            $('#'+snapshot.key)
                .animate({
                    padding: 0
                },500)
                .wrapInner('<div />')
                .children()
                .slideUp(function () {
                    $(this).remove();
                });                   
        }); 

      }); 

    }

    //SE TIVER UMA TABELA COM PAGINAÇÃO
    if($('table[ref]').length > 0 && $('.pagination').length > 0){               


      $("#cont").on("refresh", function() {
        firebase.database().ref('/_indexed'+$('table[ref]').attr('ref')+'registros').on('value', function(snap) {
          var cont = parseInt(snap.val());

          if(cont == $("table[ref] tbody tr[id]").length){
            $('#cont').html(cont+" registros");
            $('#btn-more').hide();
          }else{
            $('#cont').html($("table[ref] tbody tr[id]").length+" de "+cont);
            $('#btn-more').show();    
          }
        });
      });      

      $(".pagination").on("load", function() { 
        firebase.database().ref('/_indexed'+$('table[ref]').attr('ref')+'paginas').on('value', function(snap) { 
          if(snap.val()) {
           $('.pagination,#cont,.btn-filter').show();
           $('.pagination').html('');

            snap.forEach(function(item) {
              $('.pagination').append('<li class="waves-effect" for="'+(parseInt(item.key)+1)+'"><a href="'+href('paged',(parseInt(item.key)+1))+'">'+(parseInt(item.key)+1)+'</a></li>');    
            });

            if(typeof $_GET['paged'] == 'undefined'){
              $_GET['paged'] = 1;
            }
            
            $('.pagination li[for="'+$_GET['paged']+'"]').removeClass('waves-effect').addClass('active');

            firebase.database().ref($('table[ref]').attr('ref')).orderByKey().startAt(snap.val()[$_GET['paged']-1].start).endAt(snap.val()[$_GET['paged']-1].end).once('value', function(snapshot) {      
              $('table[ref]').removeAttr('is_empty').draw( snapshot, function() {  
                if($('#cont').length > 0){
                  $('#cont').trigger( "refresh" );
                }     
              });           
            });
          }else{  
            $('.pagination,#cont,.btn-filter').hide();
            $('table[ref]').attr( 'is_empty',true ).draw( null );
          }
        }); 
      });

      $('.pagination').trigger( "load" );

      firebase.database().ref( $('table[ref]').attr('ref') ).on('child_changed', function(snapshot) {
          row_data = snapshot.val();
          row_data.key = snapshot.key;
                  
        $('#'+snapshot.key).render( row_data );
      });   
               
      firebase.database().ref( $('table[ref]').attr('ref') ).on('child_removed', function(snapshot) {
          $('#'+snapshot.key)
              .children('td, th')
              .animate({
                  padding: 0
              },500)
              .wrapInner('<div />')
              .children()
              .slideUp(function () {
              $(this).closest('tr').remove();
          });  

          if($('#cont').length > 0){
            $('#cont').trigger( "refresh" );
          }                  
      }); 

    }

    if( $('[moment]').length > 0  ){
      setInterval(function(){ 
          $("[moment]").each(function( index ) {
            $(this).html( timeDiff( $(this).attr('moment') ) );
          }); 
      }, 10000);      
    }

    $('.chips').material_chip();

  $(".blocks > div > h2 a.btn-block-close").click(function() {
    $(this).parent().parent().toggleClass('closed');

    id = $(this).parent().parent().attr('id');
    if(typeof id != 'undefined'){
      if($(this).parent().parent().hasClass('closed')){
        $.cookie(id,true, {expires: 365, path: '/'})
      }else{
        $.removeCookie(id, { path: '/' });
      }
    }
  });   

  $(".sortable,.blocks,.columns").each(function( index ) {
    id = $(this).attr('id');
    if(typeof id != 'undefined'){
      if($.cookie(id)){ 
          var arrValuesForOrder = $.cookie(id); 
          var ul = $("#"+id);

          if(ul.prop("tagName") == 'DIV') items = $("#"+id+" div");            
          if(ul.prop("tagName") == 'UL') items = $("#"+id+" li");

          arrValuesForOrder = arrValuesForOrder.split(',');     

          for (i = 0; i < arrValuesForOrder.length; i++) { 
            ul.append( ul.find('#'+arrValuesForOrder[i]) );
          }
      }
    }
  }); 

  $(".blocks div").each(function( index ) {
    id = $(this).attr('id');
    if(typeof id != 'undefined'){
      if($.cookie(id)){
        $(this).addClass('closed');
      }
    }    
  });

  $( ".sortable,.blocks,.columns" ).sortable({
    cancel: "[unsortable]",
    revert: true,
    placeholder: "state-highlight",
    update: function() {
        id = $(this).attr('id');

        if(typeof id != 'undefined'){
          order = $(this).sortable("toArray").join(',');
          $.cookie(id,order, {expires: 365, path: '/'});  
        }
    }   
  });      
};

var page_load = window.location.pathname;

if(page_load.charAt(page_load.length-1) == '/'){
  page_load = '/app'+window.location.pathname+'index.html';
}else{
  page_load = '/app'+window.location.pathname+'.html';
}

$('main').load(page_load, function(response, status, xhr) {
  bootstrap(response, status, xhr);
});