// Sorting by value

let maxSpeed = {
    car: 300, 
    bike: 60, 
    motorbike: 200, 
    airplane: 1000,
    helicopter: 400, 
    rocket: 8 * 60 * 60
};
let sortable = [];
for (var vehicle in maxSpeed) {
    sortable.push([vehicle, maxSpeed[vehicle]]);
}

sortable.sort(function(a, b) {
    return a[1] - b[1];
});

// turning object to array

const person = {
    firstName: 'John',
    lastName: 'Doe'
};

const propertyNames = Object.keys(person);

console.log(propertyNames);

const propertyValues = Object.values(person);

console.log(propertyValues);

const entries = Object.entries(person);

console.log(entries);