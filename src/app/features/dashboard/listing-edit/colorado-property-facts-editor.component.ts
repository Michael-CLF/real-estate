import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../core/infrastructure/firebase/firebase';
import { COLORADO_FACT_DEFAULTS, type ColoradoPropertyFacts } from '../../../core/domains/offers/state-contracts/colorado/models/colorado-contract-elections';

@Component({
  selector: 'app-colorado-property-facts-editor', standalone: true, imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`:host{display:block;margin-top:24px}section{background:#fff;border:1px solid #d9e3ed;border-radius:12px;padding:24px}label{display:block;margin:14px 0}textarea,select{display:block;width:100%;padding:10px;border:1px solid #bccbd8;border-radius:6px;box-sizing:border-box}button{padding:12px 18px;background:#154360;color:white;border:0;border-radius:6px}button:disabled{opacity:.45}.error{color:#b42318}`],
  template: `
    <section>
      <h2>Colorado seller property facts</h2>
      <p>These facts carry into new offers as protected seller statements. Blank optional entries mean information was not supplied.</p>
      <form [formGroup]="form" (ngSubmit)="save()">
        @for (field of fields; track field.key) {
          <label>{{ field.label }}<textarea [formControlName]="field.key" rows="2"></textarea></label>
        }
        <label>Metropolitan district organized on or after January 1, 2000
          <select formControlName="metroDistrict">
            <option value="unselected">SELECT AN OPTION</option>
            <option value="covered">YES — COVERED METROPOLITAN DISTRICT</option>
            <option value="not_applicable">NO — NOT A COVERED METROPOLITAN DISTRICT</option>
          </select>
        </label>
        <p>For a covered district, provide its official website and completed disclosure/records reference, including service plan, debt, levies, fees, tax estimate and tax statement or certificate.</p>
        @if (error()) { <p class="error" role="alert">{{error()}}</p> }
        @if (message()) { <p role="status">{{message()}}</p> }
        <button type="submit" [disabled]="saving() || !complete()">{{saving() ? 'Saving…' : 'Save Colorado facts'}}</button>
      </form>
    </section>`,
})
export class ColoradoPropertyFactsEditorComponent {
  readonly listingUid = input.required<string>();
  readonly facts = input<ColoradoPropertyFacts | undefined>();
  private readonly fb = inject(FormBuilder);
  readonly fields = [
    ['includedItems','Additional included items and garage remotes'],['excludedItems','Excluded items'],
    ['leasedItems','Leased equipment'],['encumberedItems','Equipment debt or PACE obligation'],
    ['solarPowerPlan','Solar power purchase plan'],['parkingStorage','Parking and storage rights'],
    ['waterSource','Potable water source (required)'],['deededWaterRights','Deeded water rights'],
    ['otherWaterRights','Other water rights'],['wellPermit','Well and permit'],['waterStock','Water stock'],
    ['mineralRights','Mineral interests'],['offRecordMatters','Off-record matters and existing surveys'],
    ['thirdPartyRights','Third-party purchase or approval rights'],['leases','Continuing occupancy agreements'],
    ['metroDistrictWebsite','Official district website (if covered)'],['metroDistrictDisclosure','District disclosure and accessible records reference (if covered)'],
  ].map(([key,label]) => ({key,label}));
  readonly form = this.fb.nonNullable.group(Object.fromEntries(Object.entries(COLORADO_FACT_DEFAULTS).map(([key,value]) => [key,this.fb.nonNullable.control(value)])));
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  private loaded = false;
  constructor() { effect(() => {
    if (!this.loaded && this.listingUid()) { this.form.patchValue({...COLORADO_FACT_DEFAULTS,...this.facts()}); this.loaded=true; }
  }); }
  complete(): boolean {
    const v=this.form.getRawValue();
    return !!v['waterSource']?.trim() && ['covered','not_applicable'].includes(v['metroDistrict']) &&
      (v['metroDistrict']!=='covered' || (/^https:\/\//.test(v['metroDistrictWebsite']) && !!v['metroDistrictDisclosure']?.trim()));
  }
  async save(): Promise<void> {
    if (!this.complete() || this.saving()) return;
    this.saving.set(true);this.error.set('');this.message.set('');
    try {
      await httpsCallable(functions,'updateColoradoPropertyFacts')({listingUid:this.listingUid(),facts:this.form.getRawValue()});
      this.message.set('Saved. New offers will use these seller facts. Existing offer versions retain their original snapshot.');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'Unable to save the seller facts.'); }
    finally { this.saving.set(false); }
  }
}