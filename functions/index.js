'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);



exports.user_create = functions.auth.user().onCreate(event => {
  admin.database().ref("/_users/"+event.data.uid).set(event.data);
});
exports.user_delete = functions.auth.user().onDelete(event => {
  admin.database().ref("/_users/"+event.data.uid).remove();
});

exports.users_delete = functions.database.ref('/_users/{pushId}/').onDelete(event => {
  admin.auth().getUser(event.params.pushId)
  .then(function(userRecord) {    
    admin.auth().deleteUser(event.params.pushId);
  })
  .catch(function(error) {
    console.log("Nenhum usuario para excluir:", error);
  });
});

exports.users_create = functions.database.ref('/_users/{pushId}/').onCreate(event => {
    const snapshot = event.data;

    admin.auth().createUser({
      email: snapshot.val().email,
      password: "123mudar",
      displayName:  snapshot.val().nome
    })
    .then(function(userRecord) {
      console.log("Successfully created new user:", userRecord.uid);

      admin.database().ref("/_users/"+userRecord.uid).update(snapshot.val());
      admin.database().ref("/_users/"+event.params.pushId).remove();
    })
    .catch(function(error) {
      console.log("Error creating new user:", error);
    });  
});


var indexed_caixa = event => {
  admin.database().ref('/caixa/').once('value', function(snapshot) { 
    const ref = admin.database().ref("/_indexed/caixa/");
    const paged = 40;

    if (snapshot && snapshot.hasChildren()) {
      var index = {nomes:[],paginas:[],registros:snapshot.numChildren(),row:{saldo:0,recebimentos:0,pagamentos:0},dias:{}};

      var i = 0;
      var paged_start = '';
      var paged_end = '';

      snapshot.forEach(function(item) {
        var parts = item.val().data.split('/');
        var date = new Date(parts[2],parts[1]-1,parts[0]); 

        var valor = parseFloat(item.val().valor);

        index.row.saldo += valor;
        if(valor > 0) index.row.recebimentos += valor;
        if(valor < 0) index.row.pagamentos += valor;

        //index Day
        if(!index.dias[date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()]){
          index.dias[date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()] = {recebimentos:0,pagamentos:0};
        }

        if(valor > 0) index.dias[date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()].recebimentos += valor;
        if(valor < 0) index.dias[date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()].pagamentos += valor;                  

        if(!index.nomes[item.val().nome]){
          index.nomes[item.val().nome] = 0;
        }
        index.nomes[item.val().nome] += valor;


        i++
        if(paged_start == ''){
          paged_start = item.key;
        }

        paged_end = item.key;

        if(i == paged){
          index.paginas.push({start: paged_start, end: item.key});
          paged_start = '';
          i = 0;
        }
      });
      
      if(i > 0){
        index.paginas.push({start: paged_start, end: paged_end});
      }

      const transaction = ref.set(index).then(()=>{
        console.log(index);
      });
      return Promise.all([transaction]);
    }else{
      ref.remove();
    }
  });
};
exports.index_create_caixa = functions.database.ref('/caixa/').onWrite(indexed_caixa);
exports.index_delete_caixa = functions.database.ref('/caixa/').onDelete(indexed_caixa);


var indexed_produtos = event => {
    const snapshot = event.data;
    const ref = admin.database().ref("/_indexed/produtos/");
    const paged = 40;

    var index = {paginas:[],registros:snapshot.numChildren()};

    if (snapshot.hasChildren()) {
      var i = 0;
      var paged_start = '';
      var paged_end = '';

      snapshot.forEach(function(item) {
        i++
        if(paged_start == ''){
          paged_start = item.key;
        }

        paged_end = item.key;

        if(i == paged){
          index.paginas.push({start: paged_start, end: item.key});
          paged_start = '';
          i = 0;
        }
      });
      
      if(i > 0){
        index.paginas.push({start: paged_start, end: paged_end});
      }

      const transaction = ref.set(index).then(()=>{
        console.log(index);
      });
      return Promise.all([transaction]);
    }
};
exports.index_create_produtos = functions.database.ref('/produtos/').onWrite(indexed_produtos);
exports.index_delete_produtos = functions.database.ref('/produtos/').onDelete(indexed_produtos);


exports.fields_vendas = functions.database.ref('/vendas/{pushId}/').onWrite(event => {

  admin.database().ref('/_config/vendas/status/').once('value', function(status) { 
  
    admin.database().ref('/vendas/'+event.params.pushId+'/').once('value', function(snapshot) { 
      var vr_total = null;
      var vr_pago = null;
      var vr_restante = null;

      if(typeof snapshot.val().vr_desconto != 'undefined'){
        vr_total -= snapshot.val().vr_desconto;
      }

      let i = 0;
      for (i in snapshot.val().items) {
        vr_total += snapshot.val().items[i].valor * snapshot.val().items[i].quantidade;
      }

      i = 0;
      for (i in snapshot.val().pagamentos) {
        vr_pago += snapshot.val().pagamentos[i].valor;
      }

      vr_restante =  vr_total - vr_pago;  

      if(vr_restante == 0){
        vr_restante = null;
      }

      admin.database().ref('/vendas/'+event.params.pushId+'/').update({vr_pago,vr_total,vr_restante});

      if(snapshot.val().entrega != null && snapshot.val().status == status.val()[Object.keys(status.val())[1]].nome){
        admin.database().ref('/entregas/'+event.params.pushId+'/').set(snapshot.val().entrega);
      }else{
        admin.database().ref('/entregas/'+event.params.pushId+'/').remove();
      }
    });

  });
});  

exports.delete_venda = functions.database.ref('/vendas/{pushId}/').onDelete(event => {
      admin.database().ref('/entregas/'+event.params.pushId+'/').remove();
});


exports.create_estoque = functions.database.ref('/vendas/{venda}/items/{item}/').onCreate(event => {
    const snapshot = event.data;

    admin.database().ref('/produtos/'+snapshot.val().id+'/').once('value', function(produto) { 
      admin.database().ref('/produtos/'+snapshot.val().id+'/').update({estoque:  (parseFloat(produto.val().estoque) - parseFloat(snapshot.val().quantidade)) });
    });
});  
exports.delete_estoque = functions.database.ref('/vendas/{venda}/items/{item}/').onDelete(event => {
    const snapshot = event.data.previous;

    admin.database().ref('/produtos/'+snapshot.val().id+'/').once('value', function(produto) { 
      admin.database().ref('/produtos/'+snapshot.val().id+'/').update({estoque:  (parseFloat(produto.val().estoque) + parseFloat(snapshot.val().quantidade)) });
    });
}); 
exports.update_estoque = functions.database.ref('/vendas/{venda}/items/{item}/').onUpdate(event => {
    const snapshot = event.data.previous;
    const count = parseFloat(event.data.val().quantidade - event.data.previous.val().quantidade)

    admin.database().ref('/produtos/'+snapshot.val().id+'/').once('value', function(produto) { 
      admin.database().ref('/produtos/'+snapshot.val().id+'/').update({estoque:  (parseFloat(produto.val().estoque)-count) });
    });
}); 


exports.create_pagamento = functions.database.ref('/vendas/{venda}/pagamentos/{item}/').onCreate(event => {
	if(event.params.venda.substr(0, 1) != '_' ){
		const data = event.data.val();
		data.venda = event.params.venda;
		if(typeof data.nome == 'undefined'){
			data.nome = 'Recebimento de venda';
		}

	 admin.database().ref('/caixa/'+event.params.item+'/').set(data);
	}
});  
exports.update_pagamento = functions.database.ref('/vendas/{venda}/pagamentos/{item}/').onUpdate(event => {
	if(event.params.venda.substr(0, 1) != '_' ){
    	admin.database().ref('/caixa/'+event.params.item+'/').set(event.data.val());
	}
}); 
exports.delete_pagamento = functions.database.ref('/vendas/{venda}/pagamentos/{item}/').onDelete(event => {
	if(event.params.venda.substr(0, 1) != '_' ){
    	admin.database().ref('/caixa/'+event.params.item+'/').remove();
	}
}); 


exports.contatos_create = functions.database.ref('/vendas/{venda}/cliente/{key}/').onCreate(event => {
  admin.database().ref('/contatos/'+event.params.key+'/').set(event.data.val()); 
});
exports.contatos_update = functions.database.ref('/vendas/{venda}/cliente/{key}/').onUpdate(event => {
  admin.database().ref('/contatos/'+event.params.key+'/').update(event.data.val());
});


var indexed_contatos = event => {
  admin.database().ref('/contatos/').once('value', function(snapshot) { 
    const ref = admin.database().ref("/_indexed/contatos/");
    const paged = 40;

    if (snapshot && snapshot.hasChildren()) {
      var index = {nomes:[],paginas:[],registros:snapshot.numChildren()};

      var i = 0;
      var paged_start = '';
      var paged_end = '';

      snapshot.forEach(function(item) {
        if(!index.nomes[item.val().nome]){
          index.nomes[item.val().nome] = 1;
        }else{
          index.nomes[item.val().nome]++;
        }

        i++
        if(paged_start == ''){
          paged_start = item.key;
        }

        paged_end = item.key;

        if(i == paged){
          index.paginas.push({start: paged_start, end: item.key});
          paged_start = '';
          i = 0;
        }
      });
      
      if(i > 0){
        index.paginas.push({start: paged_start, end: paged_end});
      }

      const transaction = ref.set(index).then(()=>{
        console.log(index);
      });
      return Promise.all([transaction]);
    }else{
      ref.remove();
    }
  });
};
exports.index_create_contatos = functions.database.ref('/contatos/').onWrite(indexed_contatos);
exports.index_delete_contatos = functions.database.ref('/contatos/').onDelete(indexed_contatos);
