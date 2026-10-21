import { Validators, type AbstractControl } from '@angular/forms';
export function configureListingPropertyTypeControls(controls:{bedrooms:AbstractControl;bathrooms:AbstractControl;squareFeet:AbstractControl;yearBuilt:AbstractControl}, propertyType:string, currentYear:number):void {
 const land=propertyType==='land';
 controls.bedrooms.setValidators(land?[]:[Validators.required,Validators.min(0),Validators.max(99)]);
 controls.bathrooms.setValidators(land?[]:[Validators.required,Validators.min(0),Validators.max(99)]);
 controls.squareFeet.setValidators(land?[]:[Validators.required,Validators.min(1),Validators.max(1000000)]);
 controls.yearBuilt.setValidators(land?[]:[Validators.required,Validators.min(1600),Validators.max(currentYear+1)]);
 if(land){for(const key of ['bedrooms','bathrooms','squareFeet'] as const)controls[key].setValue(0,{emitEvent:false});controls.yearBuilt.setValue(null,{emitEvent:false});}
 for(const control of Object.values(controls))control.updateValueAndValidity({emitEvent:false});
}
