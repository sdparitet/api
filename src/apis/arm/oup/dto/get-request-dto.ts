
/**
 * @param {number} year
 * @param {number|undefined} categoryId
 */
export class OUP_GetRequestDto {
   constructor(model: OUP_GetRequestDto) {
      this.year = model.year
      this.categoryId = model.categoryId
   }

   readonly year: number;
   readonly categoryId?: number;
}
