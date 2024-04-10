
/**
 * @param {number} id
 * @param {string} year
 * @param {number} category
 * @param {number} position
 * @param {number} month
 * @param {string} value
 */
export class STAFF_PostRequestDto {
   constructor(model: STAFF_PostRequestDto) {
      this.id = model.id || -1
      this.year = model.year
      this.category = model.category
      this.position = model.position
      this.month = model.month
      this.value = model.value
   }
   readonly id: number;
   readonly year: number;
   readonly category: number;
   readonly position: number;
   readonly month: number;
   readonly value: string;
}
