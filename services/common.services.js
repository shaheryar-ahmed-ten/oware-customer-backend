exports.digitizie = (value,places)=>{
    let strValue = (value+"")
    return new Array(places - strValue.length).fill('0').join('') + strValue
  }