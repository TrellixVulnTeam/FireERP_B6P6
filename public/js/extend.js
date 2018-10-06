$.fn.draw = function (snapshot,call){
  var $obj = $(this);
  var tmpl = $obj.data('tmpl');

  if(typeof tmpl == 'undefined'){
    if($obj.prop("tagName") == 'TABLE'){
      $obj.data('tmpl', $obj.find('tbody').html()  );
    }else{
      $obj.data('tmpl', $obj.html()  );
    }

    tmpl = $obj.data('tmpl');
  }

  if($obj.prop("tagName") == 'TABLE'){
    $obj.find('tbody').html('');
  }else{
    $obj.html('');
  }

  if (snapshot && snapshot.hasChildren()) {
    $obj.removeAttr('is_empty');

    var index = 1;
    snapshot.forEach(function(item) { 
      if($('#'+item.key).length == 0){

        row_data = item.val();
        row_data.key = item.key;

        row_data.index = index;

        var element = $(tmpl).data('tmpl',tmpl).attr('data-row',JSON.stringify(row_data));
        element.render(row_data);

        if($obj.prop("tagName") == 'TABLE'){
          $obj.find('tbody').append( element );
        }else{
          $obj.append( element );
        }
       
      }else{
        $('#'+item.key).render( item.val() );
      }

      index ++;
    });

    if($obj.prop("tagName") == 'TABLE'){
      $obj.find('tbody').trigger( "render" );
    }else{
      $obj.trigger( "render" );
    }

    if( typeof call == 'function'){
      call(snapshot);
    }
  }else{
    if( typeof $obj.attr('empty') != 'undefined'){
      if($obj.prop("tagName") == 'TABLE'){
        $obj.attr('is_empty',true).find('tbody').html( $obj.attr('empty') );
      }else{
        $obj.attr('is_empty',true).html( $obj.attr('empty') );
      }
    }else{
      if($obj.prop("tagName") == 'TABLE'){
        $obj.attr('is_empty',true).find('tbody').html( '(vazio)' );
      }else if($obj.prop("tagName") == 'SELECT'){
        $obj.attr('is_empty',true).parent().hide();
      }else{
        $obj.attr('is_empty',true).html( '(vazio)' );
      }
    }    
  }
};

$.fn.update = function (data,call){
  if(typeof data == 'function'){
    call = data;
    data = undefined;
  }

  var obj = this;
  var old = {};

  if(typeof obj.attr('data-row') != 'undefined'){
    old = JSON.parse(obj.attr('data-row'));
  }

  for (var i in old) {
    if(typeof old[i] == 'object'){
      eval("var "+i+" = "+JSON.stringify(old[i])+";");
    }else{
      eval("var "+i+" = '"+old[i]+"';");
    }      
  }  

  for (var i in data) {
    if(  /\{(.+?)\}/g.test(data[i]) ){
      data[i] = eval(/\{(.+?)\}/g.exec(data[i])[1]);
    }else{
        data[i] = data[i];
    }
  }

  for (var i in data) {
    old[i] = data[i];
  }

  if( typeof call == 'function'){
    call(old);
  }  

  return obj.attr('data-row',JSON.stringify(old)).render();
};


$.fn.render = function (data,call){
  var obj = this;
  var tmpl = this.data('tmpl');

  //// se for passado uma string no segundo parametro
  if( typeof call == 'string'){
    tmpl = call;
  }

  ////se não encontrou o tmpl busca 1 acima
  if(typeof tmpl == 'undefined'){
    tmpl = this.parent().data('tmpl');
  }
  ////se não encontrou o tmpl busca 2 acima
  if(typeof tmpl == 'undefined'){
    tmpl = this.parent().parent().data('tmpl');
  }  
  ////se não encontrou o tmpl busca define pelo seu html
  if(typeof tmpl == 'undefined'){
    obj.data('tmpl', obj.html()  );
    tmpl = this.data('tmpl');
  }

  //// se vinher uma função no primeiro parametro
  if(typeof data == 'function'){
    call = data;
    data = undefined;
  } 

  //// se não vinher data tentar pegar no elemento
  if(typeof data == 'undefined'){
    if(typeof obj.attr('data-row') != 'undefined'){
      data = JSON.parse(obj.attr('data-row'));
    }
  }

  var regex = /\{(.+?)\}/g
  var matches;

  var html = tmpl;
  var arr = [];

  if(typeof data != 'undefined'){ 
    var row_data = data; 
    for (var i in row_data) {
      if(html.includes(i)){
        if(typeof row_data[i] == 'object'){
          eval("var "+i+" = "+JSON.stringify(row_data[i])+";");
        }else{
          eval("var "+i+" = '"+row_data[i]+"';");
        }
      }else{
        delete row_data[i];
      }      
    }

    while(matches = regex.exec(html)){
        try {
            arr[matches[0]] = eval($('<textarea />').html(matches[1]).text());
        } catch (e) {
            //console.log(e,matches[0]);
            //arr[matches[0]] = '';
        } 
    }
    
    for (var key in arr) {
      html = html.replaceAll(key,arr[key]);
    }    
    
    try {
      var $html = $(html);   

      ////renderizando filhos
      for (var i in row_data) {
        if( typeof row_data[i] == 'object'){
          if( $html.find('[ref="'+i+'"]').length > 0 ){
            //// render simpes
            if(typeof $html.find('[ref="'+i+'"]').attr('loop') == 'undefined'){
              $html.find('[ref="'+i+'"]').html( $html.find('[ref="'+i+'"]').render(row_data[i],$html.find('[ref="'+i+'"]').html()) ); 
            }else{
            //// render de itens
              let item = row_data[i];
              let item_tmpl = $html.find('[ref="'+i+'"]').html(); 

              let item_html = '';

              for (var x in item) {
                item_html += $(html).find('[ref="'+i+'"]').render(item[x],$(html).find('[ref="'+i+'"]').html())[0].outerHTML; 
              }

              $html.find('[ref="'+i+'"]').html(item_html);
            }
          }
        }
      }    


      $html.find("[ref]").each(function( index ) {
        if(typeof row_data[  $(this).attr('ref')  ] == 'undefined'){
          if(typeof $(this).attr('loop') == 'undefined'){
            $(this).hide();
          }else{
            $(this).html('(vazio)');
          }          
        }
      }); 

      $html.find("[moment]").each(function( index ) {
        if(moment($(this).attr('moment'), "YYYY-MM-DD HH-mm-ss").isValid()){
          $(this).html( timeDiff( $(this).attr('moment') ) );
        }else{
          $(this).hide();
        }
      });    

      html = $html[0].outerHTML;
    } catch (e) {
      html = '<div>'+html+'</div>';
    }     

    ////verificando se foi atualizado
    var update = false;
    if(obj.html() != $(html).html() ) update = true;
    if(obj.attr('id') != $(html).attr('id') ) update = true;
    if(obj.attr('class') != $(html).attr('class') ) update = true;
    if(obj.attr('ref') != $(html).attr('ref') ) update = true;    
    if(obj.attr('for') != $(html).attr('for') ) update = true;
    if(obj.attr('style') != $(html).attr('style') ) update = true;
    if(obj.attr('data-row') != $(html).attr('data-row') ) update = true;
    if(obj.attr('value') != $(html).attr('value') ) update = true;
    if(obj.length == 0) update = true;

    if( update ){
      obj.html(  $(html).html()  );
      obj.attr( 'id',  $(html).attr('id')  );
      obj.attr( 'class',  $(html).attr('class')  );
      obj.attr( 'ref',  $(html).attr('ref')  );
      obj.attr( 'for',  $(html).attr('for')  );
      obj.attr( 'style',  $(html).attr('style')  );
      obj.attr('data-row',JSON.stringify(row_data));
      obj.attr( 'value',  $(html).attr('value')  );
    }

  }else{
    obj.html('{não informado}')
  }

  if( typeof call == 'function'){
    call(data);
  }

  return $(html);
};


$.fn.once = function (ref,query,call){
  var obj = this;
    
  if(typeof ref == 'function'){
    call = ref;
    ref = undefined;
  }

  if(typeof ref == 'undefined'){
    ref = this.attr('ref');
  }

  /// SE TIVER REF DEFINIDO
  if(typeof ref != 'undefined'){
    firebase.database().ref(ref).once('value', function(snapshot) { 

      /// SE TIVER ITENS
      if (snapshot.hasChildren()) {
        obj.removeAttr('is_empty');
        
        //// MONTA AUTOCOMPLETE
        if(typeof obj.attr('autocomplete') != 'undefined'){
          var source = [];

          if (snapshot.hasChildren()) {
            snapshot.forEach(function(item) {
              source[item.key] = null;
            });
          }

          obj.autocomplete({
            data: source
          });  
          
          return obj;  
        }

        ////MONTA ARVORE
        if(typeof obj.attr('tree') != 'undefined'){
          obj.tree({
              data: snapshot.val(),
              dragAndDrop: true,
              saveState: true,
            closedIcon: $('<i class="fa fa-plus"></i>'),
            openedIcon: $('<i class="fa fa-minus"></i>')        
          }); 

          obj.bind(
              'tree.click',
              function(event) {
                if( typeof call == 'function'){
                  call(event);
                }
              }
          );   

          obj.bind(
              'tree.open',
              function(e) {
                  firebase.database().ref(ref).set(  JSON.parse($(this).tree('toJson'))  );
              }
          );
          obj.bind(
              'tree.close',
              function(e) {
                  firebase.database().ref(ref).set(  JSON.parse($(this).tree('toJson'))  );
              }
          );
          obj.bind(
              'tree.move',
              function(event){
                  event.move_info.do_move();
                  firebase.database().ref(ref).set(  JSON.parse($(this).tree('toJson'))  );
              }
          );   

          return obj;
        }

        //// MONTA LISTA
        obj.draw( snapshot,call );
      }else{
        if( typeof obj.attr('empty') != 'undefined'){
          obj.attr('is_empty',true).html( obj.attr('empty') );
        }else{
          obj.attr('is_empty',true).html( '(vazio)' );
        }

        if( typeof call == 'function'){
          call(snapshot);
        }
      }

    });
  }

  return obj;
};






$.fn.populate = function (ref,call){
  var obj = this;

  if(typeof ref == 'function'){
    call = ref;
    ref = undefined;
  }

  if(typeof ref == 'undefined'){
    ref = this.attr('ref');
  }      

  width = toFloat(obj.attr('width'));

  if(width > $(window).width()){
    width = $(window).width();
  }

  obj.parent().find('#form-row-remove').remove();

  obj.dialog({
    modal: true,
    width: width,
    buttons: [
        {
          text: "Salvar",
          icon: "ui-icon-check",
          click: function() {
            obj.submit();
          }
        }
    ]
  });

 obj.find('.chips[name]').each(function( index ) {
    let imp = $(this);

    imp.material_chip({data: []});         
 });  

  obj.find('input[type="text"],select,textarea').val('');
  obj.find('[name="key"]').val('');

  obj.find('[autofocus]').focus();
  var date = new Date();
  obj.find('[validate="date"][now]').val(date.getDate()+"/"+(date.getMonth()+1)+"/"+date.getFullYear());            

  obj.trigger("open");

  if(typeof ref != 'undefined'){
    if(ref != obj.attr('ref')){ //// se foi definido um REF diferente do form
      firebase.database().ref( ref ).once('value', function(snap) {
        data = snap.val();

        for (var i in data) {
          obj.find('[name="'+i+'"]').data('val',data[i]).val(data[i]);

          if(obj.find('[name="'+i+'"]').attr('format') == 'float'){
            obj.find('[name="'+i+'"]').val( toMoeda(data[i])  );
          }
        }          

        if(obj.find('#anexo').length > 0){
          obj.find('#anexo').html('');

          if( typeof data['anexo'] != 'undefined'){
            obj.find('#anexo').append('<img src="'+data['anexo']+'"><input name="anexo" type="hidden" value="'+data['anexo']+'">'); 
          }
        }

        obj.find('.chips[name]').each(function( index ) {
          $(this).material_chip({data: data[$(this).attr('name')]});         
        });

        obj.find('[name="key"]').val(snap.key);

        obj.find('[blur]').blur();
        obj.parent().find('.ui-dialog-buttonpane').append('<a ref="'+ref+'" href="javascript:void(0);" id="form-row-remove" class="fa fa-times"> Excluir</a>');

        
        $( "#form-row-remove" ).click(function() {
          firebase.database().ref($(this).attr('ref')).remove();
          obj.dialog('close');
        });    

        obj.trigger("edit",[ data ]);    
      });
    }else{ //// Se o REF veio do FORM
      firebase.database().ref( ref ).once('value', function(snap) {
        data = snap.val();

        for (var i in data) {
          obj.find('[name="'+i+'"]').data('val',data[i]).val(data[i]);

          if(obj.find('[name="'+i+'"]').attr('format') == 'float'){
            obj.find('[name="'+i+'"]').val( toMoeda(data[i])  );
          }
        }          

        if(obj.find('#anexo').length > 0){
          obj.find('#anexo').html('');

          if( typeof data['anexo'] != 'undefined'){
            obj.find('#anexo').append('<img src="'+data['anexo']+'"><input name="anexo['+i+']" type="hidden" value="'+data['anexo']+'">'); 
          }
        }

       obj.find('.chips[name]').each(function( index ) {
          let imp = $(this);

          imp.material_chip({data: data[imp.attr('name')]});         
       });        

        obj.find('[blur]').blur();

        obj.trigger("new");
      });
    }
  }

  if( typeof call == 'function'){
    call();
  }  
};

$.fn.resizeURI= function (width,height,call){
  var mainCanvas;

  if(typeof width == 'function'){
    call = width;
    width = undefined;
  }

  if(typeof width == 'undefined'){
    width = $(this).width();
  }
  if(typeof height == 'undefined'){
    height = $(this).height();
  }  

  function halfSize (i) {
      var canvas = document.createElement("canvas");
      canvas.width = i.width / 2;
      canvas.height = i.height / 2;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(i, 0, 0, canvas.width, canvas.height);
      return canvas;
  };

  var img = new Image();

  img.src = $(this).attr('src');

  mainCanvas = document.createElement("canvas");
  mainCanvas.width = width;
  mainCanvas.height = height;
  var ctx = mainCanvas.getContext("2d");
  ctx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
  while (mainCanvas.width > width) {
      mainCanvas = halfSize(mainCanvas);
  }
  $(this).attr('src', mainCanvas.toDataURL("image/jpeg") );

  if( typeof call == 'function'){
    call(mainCanvas.toDataURL("image/jpeg"));
  } 

  return this;
}
