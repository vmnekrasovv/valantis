"use strict";

const host = 'http://api.valantis.store:40000/';
//const host = 'https://api.valantis.store:41000/';
const password = 'Valantis';
const stamp = new Date().toISOString().slice(0,10).replace(/-/g,"");
const hash = CryptoJS.MD5(`${password}_${stamp }`);


let config = {
	method: 'POST',
    headers: {
    	'Accept': 'application/json',
		'Content-Type': 'application/json',
      	'X-Auth': hash
    }
}

let page = 1;
let reset_flag = false;
let filter_flag = false;
let filter = false;
let filter_applied = false;

async function main(){

	reset_flag_func();

	console.log('reset_flag: ' + reset_flag + ' - на входе в main');
	console.log('filter_flag: ' + filter_flag + ' - на входе в main');

	let ids = await get_ids();

	for (let i = 0; i < ids.length; i += 50) {
		
		let items = await get_items(ids.slice(i, i + 50));

		if (reset_flag) {
			reset_flag = false;
			break; 
		} 

		else if(filter_flag){
			filter_flag = false;
			break;
		}

		else { 
			console.log('else render');
			render(items);
		}
	}

	console.log('Завершение main');

	/*reset_flag = false;
	filter = false;
	filter_flag = false;*/

	console.log('reset_flag: ' +  reset_flag + ' - на выходе из main');
	console.log('filter_flag: ' + filter_flag + ' - на выходе из main');

}

let promise = main();


/*
	reset_flag флаг нужен для прерывания цикла в main, если запускали без фильтра

*/


/////////////////////////////////////////


// get_ids 



async function get_ids(){

	if(filter === false){
		config.body = JSON.stringify({'action':'get_ids'});		
	} 

	else {

		let request = {'action':'filter', "params": {}};
		request['params'][filter['name']] = filter['value'];

		config.body = JSON.stringify(request);
		
	}

	try {
		
		let response = await fetch(host, config);

		while (!response.ok) {
			console.log(response.status + " : " + response.statusText);
			console.log('Promise resolved but HTTP status failed - get_ids');
			response = await fetch(host, config);
		}

		console.log('Promise resolved and HTTP status is successful - get_ids');
		console.log('========================================================');
		console.log(' ');
		console.log(' ');

		let ids = await response.json();
		return ids.result;
	}
	catch (error){
		console.error('Promise rejected ' + error);
	}
}

/////////////////////////////////////////


// get_items 


async function get_items(ids){

	console.log(ids[0], ' ( запуск get_items )');

	config.body = JSON.stringify({'action': 'get_items', 'params': {'ids': ids}});

	try {

		let response = await fetch(host, config);

		while (!response.ok) {
			
			console.log(response.status + " : " + response.statusText);
			console.log('Promise resolved but HTTP status failed - get_items');
			
			response = await fetch(host, config);
		}

		console.log('Promise resolved and HTTP status is successful - get_items - ( response.ok await fetch() ) - ', ids[0]);
		console.log('----------------------------------------------------------');

		let items = await response.json();
		
		items = clean_items(items.result);

		console.log(' ---- return items ---- ', items[0]);
		
		return items;
	} 

	catch (error) {
		console.log(error);
	}
}


/////////////////////////////////////////

// фильтер выдачи 


let filter_input = document.querySelectorAll('.filter-item-input');
let filter_submit = document.querySelector('.filter-submit');
let filter_clear = document.querySelector('.filter-clear');


for(let i = 0; i < filter_input.length; i++){

	let elem = filter_input[i];

	elem.addEventListener('change', function(){

		if(elem.value !== ''){
			for(let j = 0; j < filter_input.length; j++){
				if(j !== i){
					filter_input[j].setAttribute('disabled', 'disabled');
				}
			}
		} else {
			for(let j = 0; j < filter_input.length; j++){
				filter_input[j].removeAttribute('disabled');
			}
		}

	});
}


filter_submit.addEventListener('click', function(){

	filter = false;
	filter_flag = false;
	
	for(let i = 0; i < filter_input.length; i++){

		let elem = filter_input[i];

		if(elem.value !== '') {

			filter = new Array;
			
			let filter_name = elem.getAttribute('name');
			filter['name'] = filter_name;
			
			if(filter_name == 'price'){
				filter['value'] = Number(elem.value);
			} else {
				filter['value'] = elem.value.trim();
			}	

			filter_flag = true;
			break;
		} 
	}
	
	promise.then(() => {

		console.log(' ');
		console.log(' ');
		console.log('*******************************');
		console.log('Предыдущий запуск main завершен - filter_submit');
		console.log('*******************************');
		console.log(' ');
		console.log(' ');

		promise = main();

		promise.then(() => {
			filter_applied = true;
		});
	});
});

filter_clear.addEventListener('click', function(){

	filter_input.forEach(function(elem){
		elem.value = '';
		elem.removeAttribute('disabled');
	});

	filter = false;
	filter_flag = false; 
	
	console.log(' ------- filter_clear.click ---------');

	if(!filter_applied){
		reset_flag = true;
	} else {
		filter_applied = false;
	}

	promise.then(() => {

		console.log(' ');
		console.log(' ');
		console.log('*******************************');
		console.log('Предыдущий запуск main завершен - filter_clear');
		console.log('*******************************');
		console.log(' ');
		console.log(' ');

		promise = main();
	});

});


/////////////////////////////////////////


// сброс при изменении полей фильтра 

function reset_flag_func(){
	page = 1;
	document.querySelector('.products-list').innerHTML = "";
	document.querySelector('.pagination-list').innerHTML = "";
}


/////////////////////////////////////////


// перебор массива items.result с отсечением дублей по айди


function clean_items(items){

	let clean_items = [];

	for(let i = 0; i < items.length; i++){

		let unique = 1;

		for(let key in clean_items) {
			key === items[i]['id'] ? unique = 0 : unique = 1;
		}
		
		unique == 1 ? clean_items[items[i]['id']] = items[i] : false;
	}

	items = [];

	for(let key in clean_items) {
		items.push(clean_items[key]);
	}

	return items;
}

/////////////////////////////////////////


// рендер айтем бокса


function render_itemBox(){

	let item_box = document.createElement('div');

	if(page === 1){
		item_box.className = 'item-box item-box-' + page + ' active';
	} else {
		item_box.className = 'item-box item-box-' + page;
	}

	document.querySelector('.products-list').append(item_box);
}


/////


// рендер элементов 

function render_items(items_item){

	let item = document.createElement('div'),
	item_id = document.createElement('div'),
	item_product = document.createElement('div'),
	item_price = document.createElement('div'),
	item_brand = document.createElement('div');


	item.className = 'item';

	item_id.className = 'id';
	item_id.append(items_item['id']);

	item_product.className = 'product';
	item_product.append(items_item['product']);

	item_price.className = 'price';
	item_price.append(items_item['price']);

	item_brand.className = 'brand';
	item_brand.append(items_item['brand']);

	item.append(item_id, item_product, item_price, item_brand);

	document.querySelector('.item-box-'+page).append(item);
}

/////

// рендер пагинации

function render_pagination(){

	let pagination_page = document.createElement('span');
		pagination_page.className = 'pagination-page';
		pagination_page.setAttribute('data', 'item-box-'+page);
		pagination_page.append(page);
		document.querySelector('.pagination-list').append(pagination_page);
}

/////

// рендер всего

function render(items){

	render_itemBox();

	for(let i = 0; i < items.length; i++){
		render_items(items[i], page);
	}

	render_pagination();

	page++;

	console.log('************************ render ******************************');
	console.log(' ');
}

/////////////////////////////////////////


// событие клика по элементам пагинации

let pagination = document.querySelector('.pagination-list');


pagination.addEventListener('DOMNodeInserted', function(event) {
	
	if(event.target.classList.contains('pagination-page')){

		event.target.addEventListener('click', function(event){
		
			let data_class = event.target.attributes.data.nodeValue;

			document.querySelectorAll('.item-box').forEach(function(elem){
				elem.classList.remove('active');
			});

			document.querySelector('.' + data_class).classList.add('active');
		});
	}

}, false);


/////////////////////////////////////////


