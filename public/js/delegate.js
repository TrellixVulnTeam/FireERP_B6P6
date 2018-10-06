//// DELEGATE ----------------------------------------------------------------------------------------------------------
var start;

$(document)
.delegate('#anexo', 'click', function(event){
  $('#anexo-file').click();
})              
.delegate('#anexo-file', 'change', function(event){
  if(this.files.length > 0){
    $('#anexo').html('');

    function setupReader(file,i,files) {
        var reader = new FileReader();  

        reader.onload = function(e) {  
          var $img = $('<img src="'+e.target.result+'" />');

          $('#anexo').append($img);                 

          $("#anexo img").one("load", function() {
            $(this).resizeURI(function(src) {
              if(files.length > 1) 
                  $('#anexo').append('<input name="anexo['+i+']" type="hidden" value="'+src+'">'); 
              else
                $('#anexo').append('<input name="anexo" type="hidden" value="'+src+'">'); 
            });            
          }).each(function() {
            if(this.complete) $(this).load();
          });

          $('#anexo img').each(function(index){
            if(index > 0) $(this).attr('style','width:'+(100/($('#anexo-btn img').length-1))+'% !important');
          });  

        }

        reader.readAsDataURL(file);
    }

    for (var i = 0; i < this.files.length; i++) {
        setupReader(this.files[i],i,this.files);
    }
  }               
})  
.delegate('#anexo img', 'load', function(event){
  alert();
})  
.delegate('#btn-login', 'click', function(event){
    var $btn = $(this);     

    firebase.auth().signInWithEmailAndPassword($('#user_login').val(), $('#user_pass').val()).catch(function(error) {
      $btn.parent().find('.result').html('<p class="alert-error">'+error.message+'</p>');
    });
})
.delegate('.btn-form-more', 'click', function(event){
  $(this).toggleClass('fa-rotate-180').parent().find('.box-more').toggle();
})
.delegate('.drop-btn', 'click', function(event){
  var btn = $(this);
  var id = btn.attr('id');  
  var obj = btn.parent().find('.'+id);

  var position = btn.position();
  var offset = btn.offset();

  var left = 0;

  if(btn.hasClass('fa-chevron-down')){
    btn.toggleClass('fa-rotate-180');
  }

  console.log( btn.height() );

  obj.toggle().css('top',offset.top + btn.outerHeight() );
  left = offset.left +(btn.outerWidth()/2) - obj.outerWidth() +(btn.outerWidth()/2); 

  if(left < 0){
    left = 0;
  }

  obj.toggle().css('left',left).toggle();
})
.delegate('#auth', 'click', function(event){  
    firebase.auth().signOut().then(function() {
      $('#login').show();
    }, function(error) {
      console.error("The auth failed: " + errorObject.code);
    });
})
.delegate('.btn-filter', 'click', function(event){
    $('.tip').toggle();
    $(this).toggleClass('selected');
    $('#search').focus();
})
.delegate("[validate='moeda']", 'keypress', function(e){
    if(typeof e.charCode == 'undefined') e.charCode = 0;
    if(typeof e.keyCode == 'undefined') e.keyCode = 0;

    if(e.keyCode == 61){
      var v = $(this).val();
            v = v.replaceAll(".", "");            
            v = v.replaceAll(",", ".");
        $(this).val(v);

      $(this).val( toMoeda(eval($(this).val())) );
    }

    if(!( (e.charCode > 47 && e.charCode < 58) || (e.charCode >= 42 && e.charCode <= 47) || e.charCode == 9 || e.charCode == 13) ){
        if(!( (e.keyCode > 47 && e.keyCode < 58) || (e.keyCode >= 42 && e.keyCode <= 47) || e.keyCode == 9 || e.keyCode == 13) ){
            e.charCode = 0;
            return false;
        }
    }
})
.delegate("[validate='moeda']", 'blur', function(){
    if($(this).val() != ''){
        var v = $(this).val(); 
            v = v.replaceAll(" ", "");
            v = v.replaceAll("R$", "");

            if (/\./.test(v)) v = v.replaceAll(".", "");
            if (/\,/.test(v)) v = v.replaceAll(",", ".");
            if (/^([0-9])*$/.test(v)) v = v + '.00';
          
            v = toMoeda(v);

        $(this).val(v);
    }

    if (/^([0-9\.\-]*)\,[0-9]{2}$/.test( $(this).val() ) || $(this).val() == "")
        $(this).parent().removeClass('form-invalid');               
    else
        $(this).parent().addClass('form-invalid');       
})
.delegate("input[ref],select[ref],textarea[ref]", 'blur', function(){
  if(typeof $(this).attr('on') == 'undefined' && typeof $(this).attr('once') == 'undefined' && typeof $(this).attr('once') == 'autocomplete'){
    ref = $(this).attr('ref');
    value = $(this).val();

    if($(this).attr('validate') == 'moeda'){
      if($(this).attr('format') == 'float'){
        value = toFloat( $(this).val() );          
      }
    } 

    firebase.database().ref(ref).set(value);
  }
})
.delegate('table[ref] tbody tr', 'mousedown', function(event){
    var $this = $(this);
    start = setTimeout(function(){
        $this.addClass('selected');
        $this.addClass('skip');
    },1000);
})
.delegate('table[ref] tbody tr', 'mouseleave', function(event){
  clearTimeout(start);
})
.delegate('table[ref] tbody tr', 'click', function(event){
  if($(this).hasClass('skip')){
    $(this).removeClass('skip');
    return false;
  }

  if(event.ctrlKey || $('tr.selected').length > 0){
    $(this).toggleClass('selected');
  }else{
    var ref = $(this).parent().parent().attr('ref');
    var key = $(this).attr('id');


    $("form[ref='"+ref+"']").populate(ref+key);
  }
})
.delegate('[ref][on] li[id]', 'click', function( event ){
  ref = $(this).parent().attr('ref');
  key = $(this).attr('id');

  if($('form[ref="'+ref+'"]').length > 0){
    $('form[ref="'+ref+'"]').populate(ref+key);
  }
})  
.delegate('.btn-form', 'click', function( event ){
  var $btn = $(this);         

  $('#'+$btn.attr('ref')+'').populate();
  $btn.trigger("open");  
})
.delegate('#mask,#btn-nav-visible', 'click', function( event ){
  $('body').toggleClass('nav-visible');
})
.delegate('#search', 'keyup', function( event ){
  var $imp = $(this);
  var child = $(this).attr('ref');

  if(typeof child == 'undefined') child = 'nome';

  if($('section table[ref]').length > 0){
    clearTimeout(start);
    start = setTimeout(function(){ 

      if($imp.val() == ''){
        $('.pagination').trigger( "load" );
        $('.pagination,#cont').show();
      }else{
        var query = firebase.database().ref($('table[ref]').attr('ref')).orderByChild(child).startAt($imp.val()).endAt($imp.val()+"\uf8ff");

        query.once('value', function(snapshot) {
          $('table[ref]').draw( snapshot, function(snapshot) {
            $('.pagination,#cont').hide();
          });
        });
      }
    }, 500);    
  }

  if($('section ul[ref]').length > 0){
    clearTimeout(start);
    start = setTimeout(function(){ 
      if($imp.val() == ''){
        $('section ul[ref]').removeAttr('filtered').once();
      }else{
        var query = firebase.database().ref($('section ul[ref]').attr('ref')).orderByChild(child).startAt($imp.val()).endAt($imp.val()+"\uf8ff");

        query.once('value', function(snapshot) {
          $('section ul[ref]').attr('filtered',true).draw( snapshot );
        });
      }
    }, 500);
  }

})
.delegate('form[ref]', 'submit', function( event ){
  if(!this.checkValidity() && typeof $(this).attr('novalidate') == 'undefined'){
    $(this).find(':invalid').first().focus();
    $(this).find(':invalid').css('background','#fdd');
  }else{
    $frm = $(this);
    data = getFormData($frm);

     $frm.find('.chips').each(function( index ) {
        let obj = $(this);

        data[obj.attr('name')] = [];
        $frm.find('.chip').each(function( index ) {
          data[obj.attr('name')].push( { tag:$(this).text().replace('close','')} );
        });
     });

    $frm.find('[validate="date"][format]').each(function( index ) {
      data[$(this).attr('name')] = moment($(this).val(), ["DD/MM/YYYY", "YYYY-MM-DD"]).format($(this).attr('format'));
    }); 

    $frm.find('[validate="moeda"][format]').each(function( index ) {          
      if($(this).attr('format') == 'float'){
        data[$(this).attr('name')] = toFloat( $(this).val() );          
      }
    }); 

    $frm.find('[validate="date"]').each(function( index ) {
      if(typeof data[$(this).attr('name')+'_time'] != 'undefined'){
        data[$(this).attr('name')] = data[$(this).attr('name')] + ' ' +data[$(this).attr('name')+'_time'];
        delete data[$(this).attr('name')+'_time'];

        data[$(this).attr('name')] = data[$(this).attr('name')].replace(' 00:00','');
      }
    });

    var key = data.key;
    delete data.key;

    if($frm.find('[name="key"]').length == 0){
      firebase.database().ref($frm.attr('ref')).set(data);
    }else{
      if(typeof key != 'undefined' && key != ''){ 
        firebase.database().ref($frm.attr('ref')+key).update(data);
        Materialize.toast('Editado com sucesso!', 4000);

        worker.postMessage($frm.attr('ref')+key);
      }else{
        firebase.database().ref($frm.attr('ref')).push().set(data);
        Materialize.toast('Salvo com sucesso!', 4000);

        worker.postMessage($frm.attr('ref'));
      }
    }

    $frm.dialog( "close" );
  }  

  return false;
}).delegate('a', 'click', function( event ){
  var href = $(this).attr('href');

  if(href.substr(0,1) == '/'){
    if(!$(this).hasClass('target')){
      window.history.pushState("object or string", "Title", href);

      var page_load = href;

      if(page_load.charAt(page_load.length-1) == '/'){
        page_load = '/app'+window.location.pathname+'index.html';
      }else{
        page_load = '/app'+window.location.pathname+'.html';
      }

      $('main').load(page_load, function(response, status, xhr) {
        bootstrap(response, status, xhr);
      });

      return false;
    }
  }
});