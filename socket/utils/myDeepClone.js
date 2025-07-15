const myDeepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(myDeepClone);
  }
  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = myDeepClone(obj[key]);
    }
  }
  return clonedObj;
};

export default myDeepClone; 