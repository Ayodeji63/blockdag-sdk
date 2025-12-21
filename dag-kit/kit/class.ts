// class Car1 {
//   constructor(name, year) {
//     this.name = name;
//     this.year = year;
//   }

//   age() {
//     const date = new Date();
//     return date.getFullYear() - this.year;
//   }
// }

// const myCar1 = new Car1("Ford", 2014);
// const myCar2 = new Car1("Audi", 2019);

// // console.log("My Car is " + myCar1.age() + "years old.");
// // console.log(myCar2);

// /***
//  * Class Inheritance
//  */

// class Car {
//   constructor(brand: string) {
//     this.carname = brand;
//   }
//   present() {
//     return "I have a " + this.carname;
//   }

//   change(newBrand: string) {
//     this.carname = newBrand;
//     return "My Car name is now " + this.carname;
//   }
// }

// class Model extends Car {
//   constructor(brand: string, mod: string) {
//     super(brand);
//     this.model = mod;
//   }
//   show() {
//     return this.present() + ", it is a " + this.model;
//   }
// }

// let myCar = new Model("Ford", "Mustang");

// // console.log(myCar.show());

// // myCar.change("Ferrari");

// // console.log(myCar);
// // console.log(myCar.show());

// class Car2 {
//   constructor(brand) {
//     this._carname = brand;
//   }
//   get carname() {
//     return this._carname;
//   }
//   set carname(x) {
//     this._carname = x;
//   }
// }

// const _car = new Car2("Ford");
// // console.log(_car.carname);

// _car.carname = "Bugatti";

// // console.log(_car.carname);

// class Car3 {
//   constructor(name) {
//     this.name = name;
//   }
//   static hello(x) {
//     return "Hello!! " + x.name;
//   }
// }

// const _myCar = new Car3("Ferrari");

// console.log(Car3.hello(_myCar));
