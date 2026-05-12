import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleIntakeNewComponent } from './vehicle-intake-new.component';

describe('VehicleIntakeNewComponent', () => {
  let component: VehicleIntakeNewComponent;
  let fixture: ComponentFixture<VehicleIntakeNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleIntakeNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleIntakeNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
