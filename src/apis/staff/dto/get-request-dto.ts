
/**
 * @param {number} year
 */
export class STAFF_GetRequestDto {
   constructor(model: STAFF_GetRequestDto) {
      this.year = model.year
   }

   readonly year: number;
}
