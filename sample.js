const add = (a, b) => a + b;

const pie = 3.146;

class AnyObject{
  constructor() {
    console.log('new obj things');
  }
};

module.exports = {
  ad_ : add,
  pi_ : pie,
  ao_ : AnyObject
}