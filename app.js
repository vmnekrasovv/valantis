"use strict";

const host = 'http://api.valantis.store:40000/';
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
let filter = false;


async function main(){

	reset();
	
	let ids = await get_ids();

	async function check_ids(){

		ids = await get_ids();	
		
		if(ids === undefined){	
			await check_ids();
		} else {return ids;}
	}	

	await check_ids();
 
	if(filter === false){
		for (let i = 0; i < ids.length; i += 50) {
			if(filter === false) {
				let response = await get_items(ids.slice(i, i + 50));
			} else { 
				reset();
				break;
			}
		}
	}	
}

main();


async function main_filter(){

	reset();

 	let ids = await get_ids();

 	async function check_ids(){

		ids = await get_ids();	
		
		if(ids === undefined){	
			await check_ids();
		} else {return ids;}
	}	

	await check_ids();

	for (let i = 0; i < ids.length; i += 50) {
		let response = await get_items(ids.slice(i, i + 50));
	}

}


async function get_ids(){

	if(filter === false){
		config.body = JSON.stringify({'action':'get_ids'});		
	} 

	else {

		let request = {'action':'filter', "params": {}};
		request['params'][filter['name']] = filter['value'];

		config.body = JSON.stringify(request);
		
	}

	let response = await fetch(host, config);

	if (response.ok) {
		let ids = await response.json();
		ids = ids.result;
		return ids;
	} 

	else {
		console.log(response.status + " : " + response.statusText + ' - get_ids');
		await get_ids();
	}
}

async function get_items(ids){

	config.body = JSON.stringify({'action': 'get_items', 'params': {'ids': ids}});
	
	let response = await fetch(host, config);

	if(response.ok){

		let items = await response.json();
		items = clean_items(items.result);


	// render 

		let item_box = document.createElement('div');

		if(page === 1){
			item_box.className = 'item-box item-box-' + page + ' active';
		} else {
			item_box.className = 'item-box item-box-' + page;
		}

		document.querySelector('.products-list').append(item_box);

		for(let i = 0; i < items.length; i++){
			render_items(items[i], page);
		}

		render_pagination();

		page++;

	} else {
		console.log(response.status + " : " + response.statusText + ' - get_items');
		get_items(ids);
	}
}


//////////////// фильтер выдачи //////////////////////////////////


async function filter_event(){

	let filter_input = document.querySelectorAll('.filter-item-input');
	let filter_submit = document.querySelector('.filter-submit');
	let filter_clear = document.querySelector('.filter-clear');


	for(let i = 0; i < filter_input.length; i++){
	
		let elem = filter_input[i];

		elem.addEventListener('change', async function(){

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


	filter_submit.addEventListener('click', async function(){
		
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

				break;
			} else {
				filter = false;
			}
		}

		if(filter !== false){
			await main_filter();
		} else { await main(); }

	});

	filter_clear.addEventListener('click', async function(){

		filter_input.forEach(function(elem){
			elem.value = '';
			elem.removeAttribute('disabled');
		});

		filter = false;

		await main();
	});
}

filter_event();


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


///////////// рендер элементов ///////////////////

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


///////////// рендер пагинации ///////////////////

function render_pagination(){

	let pagination_page = document.createElement('span');
		pagination_page.className = 'pagination-page';
		pagination_page.setAttribute('data', 'item-box-'+page);
		pagination_page.append(page);
		document.querySelector('.pagination-list').append(pagination_page);
}


/////////////// событие клика по элементам пагинации ///////////////

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


////////////////// сброс при изменении полей фильтра ///////////////////////

function reset(){
	page = 1;
	document.querySelector('.products-list').innerHTML = "";
	document.querySelector('.pagination-list').innerHTML = "";
}