// console.log(
//   Buffer.from(
//     "UGF5Y29tOlV6Y2FyZDpzb21lUmFuZG9tU3RyaW5nMTU0NTM0MzU0MzU0NQ==",
//     "base64"
//   )
//     .toString()
//     .split(":")
// );

const a = [{ id: 1 }, { id: 3 }];
const b = a.splice(0, 1, { id: 2 });

console.log("a: ", a);
console.log("b: ", b);
