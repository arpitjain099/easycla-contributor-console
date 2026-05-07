// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AppSettings } from 'src/app/config/app-settings';
import { StorageService } from 'src/app/shared/services/storage.service';
import { AuthDashboardComponent } from './auth-dashboard.component';

describe('AuthDashboardComponent', () => {
  let component: AuthDashboardComponent;
  let fixture: ComponentFixture<AuthDashboardComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let storageSpy: jasmine.SpyObj<StorageService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    storageSpy = jasmine.createSpyObj<StorageService>('StorageService', ['getItem']);
    storageSpy.getItem.and.returnValue(null);

    await TestBed.configureTestingModule({
      declarations: [AuthDashboardComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: StorageService, useValue: storageSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('navigates to /cla/project/:projectId/user/:userId with redirect query param on init', () => {
    storageSpy.getItem.and.callFake(((key: string) => {
      switch (key) {
        case AppSettings.PROJECT_ID:
          return JSON.stringify('proj-123');
        case AppSettings.USER_ID:
          return JSON.stringify('user-456');
        case AppSettings.REDIRECT:
          return JSON.stringify('https://github.com/foo/bar/pull/42');
        default:
          return null;
      }
    }) as <T>(key: string) => T);

    fixture.detectChanges();

    expect(storageSpy.getItem).toHaveBeenCalledWith(AppSettings.PROJECT_ID);
    expect(storageSpy.getItem).toHaveBeenCalledWith(AppSettings.USER_ID);
    expect(storageSpy.getItem).toHaveBeenCalledWith(AppSettings.REDIRECT);
    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(
      ['/cla/project/proj-123/user/user-456'],
      { queryParams: { redirect: 'https://github.com/foo/bar/pull/42' } }
    );
  });
});
