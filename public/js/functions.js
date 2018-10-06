String.prototype.replaceAll = function(de, para){
    var str = this;
    var pos = str.indexOf(de);
    while (pos > -1){
        str = str.replace(de, para);
        pos = str.indexOf(de);
    }
    return (str);
}
String.prototype.toMoeda = function(){
  return toMoeda(this);
}
String.prototype.toFloat = function(){
  return toFloat(this);
}


function toUpCase(text) {
    var words = text.toLowerCase().split(" ");
    for (var a = 0; a < words.length; a++) {
        var w = words[a];
        words[a] = w[0].toUpperCase() + w.slice(1);
    }
    return words.join(" ");
}

function toMoeda(num){
 x = 0;

 if(num<0) {
    num = Math.abs(num);
    x = 1;
 }
 if(isNaN(num)) num = "0";
    cents = Math.floor((num*100+0.5)%100);

 num = Math.floor((num*100+0.5)/100).toString();

 if(cents < 10) cents = "0" + cents;
    for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
       num = num.substring(0,num.length-(4*i+3))+'.'
             +num.substring(num.length-(4*i+3));
 ret = num + ',' + cents;
 if (x == 1) ret = '-' + ret;return ret;
}
function toFloat(num){
  if( typeof num == 'string'){
    num = num.replace('R$ ','');
    num = num.replace('.','');
    num = num.replace(',','.');
  }

  return parseFloat(num);
}
function getFormData(dom_query){
    var out = {};
    var s_data = $(dom_query).serializeArray();
    //transform into simple data/value object
    for(var i = 0; i<s_data.length; i++){
        var record = s_data[i];
        out[record.name] = record.value;
    }
    return out;
}

function href(key,value){
  url = window.location.href.split('?');

  url[0] += '?';
  g = '';
  if(typeof url[1] != 'undefined'){
    url[1] = url[1].split('&');
    
    $.each(url[1], function(k, v){
      if(g != '') g += '&';
      
      v = v.split('=');
      if(v[0] != key){
        g += v[0];
        if(typeof v[1] != 'undefined'){
          g += '='+v[1];
        }
      }
    });
  }
  if(g != '') g += '&';

  g += key+'='+value;

  return url[0]+g;
}

function timeDiff(time){
  var now = moment();
  var then = moment(time, "YYYY-MM-DD HH:mm:ss");

  if(now.diff(then) > 0){
    return 'Passou ' + moment.duration(now.diff(then)).humanize();
  }else{
    return 'Falta ' + moment.duration(now.diff(then)).humanize();
  }
}

function sortJsonArrayByProperty(objArray, prop, direction){
    if (arguments.length<2) throw new Error("sortJsonArrayByProp requires 2 arguments");
    var direct = arguments.length>2 ? arguments[2] : 1; //Default to ascending

    if (objArray && objArray.constructor===Array){
        var propPath = (prop.constructor===Array) ? prop : prop.split(".");
        objArray.sort(function(a,b){
            for (var p in propPath){
                if (a[propPath[p]] && b[propPath[p]]){
                    a = a[propPath[p]];
                    b = b[propPath[p]];
                }
            }
            // convert numeric strings to integers
            a = a.match(/^\d+$/) ? +a : a;
            b = b.match(/^\d+$/) ? +b : b;
            return ( (a < b) ? -1*direct : ((a > b) ? 1*direct : 0) );
        });
    }
}

function set(ref,data){  
  firebase.database().ref(ref).once('value', function(snapshot) { 
    var old = snapshot.val();

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


    firebase.database().ref(ref).update(data);
  });
}

function isCPF(cpf){
  cpf = cpf.replace(/\./,'');
  cpf = cpf.replace(/\./,'');
  cpf = cpf.replace(/\-/,'');
  cpf = cpf.replace(/\//,'');
  
    var numeros, digitos, soma, i, resultado, digitos_iguais;
    digitos_iguais = 1;
    if (cpf.length < 11)
        return false;
    for (i = 0; i < cpf.length - 1; i++)
        if (cpf.charAt(i) != cpf.charAt(i + 1))
        {
            digitos_iguais = 0;
            break;
        }
    if (!digitos_iguais){
        numeros = cpf.substring(0,9);
        digitos = cpf.substring(9);
        soma = 0;
        for (i = 10; i > 1; i--)
            soma += numeros.charAt(10 - i) * i;
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;
        numeros = cpf.substring(0,10);
        soma = 0;
        for (i = 11; i > 1; i--)
            soma += numeros.charAt(11 - i) * i;
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;
        return true;
    }
    else
        return false;
}

function isCNPJ(cnpj){
  cnpj = cnpj.replace(/\./,'');
  cnpj = cnpj.replace(/\./,'');
  cnpj = cnpj.replace(/\-/,'');
  cnpj = cnpj.replace(/\//,'');

    var numeros, digitos, soma, i, resultado, pos, tamanho, digitos_iguais;
    digitos_iguais = 1;
    if (cnpj.length < 14 && cnpj.length < 15)
        return false;
    for (i = 0; i < cnpj.length - 1; i++)
        if (cnpj.charAt(i) != cnpj.charAt(i + 1))
        {
            digitos_iguais = 0;
            break;
        }
    if (!digitos_iguais){
        tamanho = cnpj.length - 2
        numeros = cnpj.substring(0,tamanho);
        digitos = cnpj.substring(tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--){
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0,tamanho);
        soma = 0;
        pos = tamanho - 7;
        for (i = tamanho; i >= 1; i--){
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;
        return true;
    }
    else
        return false;
}