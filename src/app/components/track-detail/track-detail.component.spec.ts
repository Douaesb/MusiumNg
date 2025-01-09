import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrackDetailComponent } from './track-detail.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { of, throwError } from 'rxjs';
import { Track } from '../../state/track/track.models';
import * as TrackActions from '../../state/track/track.actions';
import * as AudioActions from '../../state/audio/audio.actions';
import { TrackState } from '../../state/track/track.reducer';

describe('TrackDetailComponent', () => {
  let component: TrackDetailComponent;
  let fixture: ComponentFixture<TrackDetailComponent>;
  let mockStore: MockStore;
  let mockIndexedDbService: jasmine.SpyObj<IndexedDbService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTrack: Track = {
    id: 1,
    title: 'Test Track',
    artist: 'Test Artist',
    description: 'Test Description',
    duration: 180,
    category: 'Test Category',
    createdAt: new Date(),
    audioFileId: 1,
    imageFileId: 1,
    imageUrl: 'test-image-url'
  };

  const initialState: { track: TrackState } = {
    track: {
      tracks: [],
      selectedTrack: null,
      error: null
    }
  };

  beforeEach(async () => {
    mockIndexedDbService = jasmine.createSpyObj('IndexedDbService', ['getTrackById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TrackDetailComponent],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' })
          }
        },
        { provide: IndexedDbService, useValue: mockIndexedDbService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch').and.callThrough();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch track and dispatch actions on init', fakeAsync(() => {
    mockIndexedDbService.getTrackById.and.returnValue(of(mockTrack));
    
    fixture.detectChanges();
    tick();

    expect(mockIndexedDbService.getTrackById).toHaveBeenCalledWith(1);
    expect(mockStore.dispatch).toHaveBeenCalledWith(TrackActions.selectTrack({ track: mockTrack }));
    expect(mockStore.dispatch).toHaveBeenCalledWith(AudioActions.selectTrack({ track: mockTrack }));
  }));

  it('should handle track not found', fakeAsync(() => {
    mockIndexedDbService.getTrackById.and.returnValue(of(undefined));
    
    fixture.detectChanges();
    tick();

    expect(mockStore.dispatch).toHaveBeenCalledWith(TrackActions.selectTrack({ track: null }));
  }));

  it('should handle error when fetching track', fakeAsync(() => {
    mockIndexedDbService.getTrackById.and.returnValue(throwError(() => new Error('Test error')));
    
    fixture.detectChanges();
    tick();

    expect(mockStore.dispatch).toHaveBeenCalledWith(TrackActions.selectTrack({ track: null }));
  }));

  it('should redirect to tracks page', () => {
    component.redirectToTracksPage();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tracks']);
  });

  it('should unsubscribe on destroy', () => {
    const unsubscribeSpy = spyOn(component['subscriptions'], 'unsubscribe');
    component.ngOnDestroy();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});