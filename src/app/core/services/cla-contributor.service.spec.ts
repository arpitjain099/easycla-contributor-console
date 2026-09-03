// Copyright The Linux Foundation and each contributor to CommunityBridge.
// SPDX-License-Identifier: MIT

import { TestBed } from '@angular/core/testing';

import { ClaContributorService } from './cla-contributor.service';
import { HttpClientModule } from '@angular/common/http';
import { AlertService } from 'src/app/shared/services/alert.service';
import { RouterTestingModule } from '@angular/router/testing';
import { StorageService } from 'src/app/shared/services/storage.service';
import { AppSettings } from 'src/app/config/app-settings';

describe('ClaContributorService', () => {
    let service: ClaContributorService;
    let storageService: StorageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule, HttpClientModule],
            providers: [AlertService, StorageService]
        });
        service = TestBed.inject(ClaContributorService);
        storageService = TestBed.inject(StorageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getLFXCorporateURL', () => {
        const repo = (repository_name: string) => ({ repository_name });
        const sfProject = (project_sfid: string, repos: any[] = []) => ({
            project_sfid,
            foundation_sfid: 'FOUNDATION_SFID',
            github_repos: repos,
            gitlab_repos: [],
            gerrit_repos: []
        });

        // Stubs the two localStorage keys the method reads: the CLA Group and the redirect URL
        // the contributor arrived with.
        const givenStoredState = (claGroup: any, redirect: string | null) => {
            spyOn(storageService, 'getItem').and.callFake((key: string): any => {
                if (key === AppSettings.PROJECT) {
                    return JSON.stringify(claGroup);
                }
                if (key === AppSettings.REDIRECT) {
                    return JSON.stringify(redirect);
                }
                return null;
            });
        };

        it('redirects to the company dashboard when the CLA Group has no SF projects', () => {
            givenStoredState({ projects: [], signed_at_foundation_level: false }, 'https://github.com/org/repo/pull/1');

            expect(service.getLFXCorporateURL()).toBe(service.corporateV2Base + 'company/dashboard');
        });

        it('redirects to the foundation CLA page when signed at foundation level', () => {
            givenStoredState({
                projects: [sfProject('PROJECT_SFID')],
                signed_at_foundation_level: true
            }, 'https://github.com/org/repo/pull/1');

            expect(service.getLFXCorporateURL()).toBe(service.corporateV2Base + 'foundation/FOUNDATION_SFID/cla');
        });

        it('redirects to the project matching the repository the contributor came from', () => {
            givenStoredState({
                projects: [
                    sfProject('OTHER_SFID', [repo('org/other')]),
                    sfProject('MATCHED_SFID', [repo('org/repo')])
                ],
                signed_at_foundation_level: false
            }, 'https://github.com/org/repo/pull/1');

            expect(service.getLFXCorporateURL())
                .toBe(service.corporateV2Base + 'foundation/FOUNDATION_SFID/project/MATCHED_SFID/cla');
        });

        // Contributors arriving from LFX Self Serve carry a console URL, not a repository URL,
        // so the repository match can never succeed for them.
        it('falls back to the only project when the redirect is not a repository URL', () => {
            givenStoredState({
                projects: [sfProject('ONLY_SFID', [repo('org/repo')])],
                signed_at_foundation_level: false
            }, 'https://app.lfx.dev/profile/clas');

            expect(service.getLFXCorporateURL())
                .toBe(service.corporateV2Base + 'foundation/FOUNDATION_SFID/project/ONLY_SFID/cla');
        });

        it('falls back to the company dashboard when the repository is unmatched and the CLA Group spans several projects', () => {
            givenStoredState({
                projects: [
                    sfProject('FIRST_SFID', [repo('org/first')]),
                    sfProject('SECOND_SFID', [repo('org/second')])
                ],
                signed_at_foundation_level: false
            }, 'https://app.lfx.dev/profile/clas');

            expect(service.getLFXCorporateURL()).toBe(service.corporateV2Base + 'company/dashboard');
        });

        it('never returns an empty URL when no redirect was stored', () => {
            givenStoredState({
                projects: [sfProject('ONLY_SFID', [repo('org/repo')])],
                signed_at_foundation_level: false
            }, null);

            expect(service.getLFXCorporateURL()).toBe(service.corporateV2Base + 'foundation/FOUNDATION_SFID/project/ONLY_SFID/cla');
        });
    });
});
