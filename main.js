/*
Author: Ivan Zarkovic
Date: 29.08.2022.
Reference: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises
*/

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////PROMISES////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const fetchPromise = fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');

console.log(fetchPromise);

fetchPromise.then((response) => {
    console.log(`Received response: ${response.status}`);
});

console.log("Started request…");

// initial promise call
// fetchPromise.then((response) => {
//     const jsonPromise = response.json();
//     jsonPromise.then((data) => {
//         console.log('Chained promise', data[0]);
//     });
// });

// shorten promise call avoiding callback hell
// this is called promise chaining
// fetchPromise
//     .then((response) => response.json())
//     .then((data) => {
//         console.log(data[0].name);
//     });

// same code from above but with handling response status
// fetchPromise
//     .then((response) => {
//         if (!response.ok) {
//             throw new Error(`HTTP error: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then((data) => {
//         console.log(data[0].name);
//     })
//     .catch((error) => {
//         console.error(`Could not get products: ${error}`);
//     });

// calling multiple promises
const fetchPromise1 = fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');
const fetchPromise2 = fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/not-found');
const fetchPromise3 = fetch('https://mdn.github.io/learning-area/javascript/oojs/json/superheroes.json');

Promise.all([fetchPromise1, fetchPromise2, fetchPromise3])
    .then((responses) => {
        for (const response of responses) {
            console.log(`${response.url}: ${response.status}`);
        }
    })
    .catch((error) => {
        console.error(`Failed to fetch: ${error}`)
    });

// we also have Promise.any where it is fulfilled when any one of a set of promises is fulfilled

Promise.any([fetchPromise1, fetchPromise2, fetchPromise3])
    .then((response) => {
        console.log(`${response.url}: ${response.status}`);
    })
    .catch((error) => {
        console.error(`Failed to fetch: ${error}`)
    });

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////ASYNC AND AWAIT//////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

async function fetchProducts() {
    try {
        // after this line, our function will wait for the `fetch()` call to be settled
        // the `fetch()` call will either return a Response or throw an error
        const response = await fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        // after this line, our function will wait for the `response.json()` call to be settled
        // the `response.json()` call will either return the parsed JSON object or throw an error
        const data = await response.json();
        console.log(data[0].name);
    }
    catch (error) {
        console.error(`Could not get products: ${error}`);
    }
}

fetchProducts();

// "Note though that async functions always return a promise, so you can't do something like:"

async function fetchProducts() {
    try {
        const response = await fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(`Could not get products: ${error}`);
    }
}

const promise2 = fetchProducts();
console.log(promise2[0].name);   // "promise" is a Promise object, so this will not work

// Instead we call .then() on promise so we can get data

async function fetchProducts() {
    try {
        const response = await fetch('https://mdn.github.io/learning-area/javascript/apis/fetching-data/can-store/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error(`Could not get products: ${error}`);
    }
}

const promise = fetchProducts();
promise.then((data) => console.log(data[0].name));