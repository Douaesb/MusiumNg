import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AudioPlayerComponent } from './audio-player.component';
import { Store } from '@ngrx/store';
import { IndexedDbService } from '../../core/services/indexed-db.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Track } from '../../state/track/track.models';
import { ElementRef } from '@angular/core';

describe('AudioPlayerComponent', () => {
  let component: AudioPlayerComponent;
  let fixture: ComponentFixture<AudioPlayerComponent>;
  let mockStore: jasmine.SpyObj<Store>;
  let mockIndexedDbService: jasmine.SpyObj<IndexedDbService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAudioElement: any;

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

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select']);
    mockIndexedDbService = jasmine.createSpyObj('IndexedDbService', [
      'getTrackById',
      'getAudioFileUrl',
      'getImageFileUrl',
      'getNextTrack',
      'getPreviousTrack'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockStore.select.and.returnValue(of(mockTrack));
    mockIndexedDbService.getTrackById.and.returnValue(of(mockTrack));
    mockIndexedDbService.getAudioFileUrl.and.returnValue(of('test-url'));
    mockIndexedDbService.getImageFileUrl.and.returnValue(of('test-image'));
    mockIndexedDbService.getNextTrack.and.returnValue(of(mockTrack));
    mockIndexedDbService.getPreviousTrack.and.returnValue(of(mockTrack));

    await TestBed.configureTestingModule({
      imports: [AudioPlayerComponent],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: IndexedDbService, useValue: mockIndexedDbService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '1' }) }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioPlayerComponent);
    component = fixture.componentInstance;
    
    mockAudioElement = {
      play: jasmine.createSpy('play').and.returnValue(Promise.resolve()),
      pause: jasmine.createSpy('pause'),
      load: jasmine.createSpy('load'),
      currentTime: 0,
      duration: 180,
      volume: 1,
      buffered: {
        length: 1,
        end: () => 250
      },
      readyState: 4
    };

    component.audioPlayerRef = new ElementRef(mockAudioElement);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });




  it('should format time correctly', () => {
    expect(component.formatTime(65)).toBe('1:05');
    expect(component.formatTime(130)).toBe('2:10');
  });


  it('should navigate to next track', fakeAsync(() => {
    const nextTrack: Track = {
      ...mockTrack,
      id: 2,
      title: 'Next Track'
    };
    mockIndexedDbService.getNextTrack.and.returnValue(of(nextTrack));
    
    component.track = mockTrack;
    component.nextTrack();
    tick();
    
    expect(mockIndexedDbService.getNextTrack).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tracks/2']);
  }));

  it('should navigate to previous track', fakeAsync(() => {
    const prevTrack: Track = {
      ...mockTrack,
      id: 3,
      title: 'Previous Track'
    };
    mockIndexedDbService.getPreviousTrack.and.returnValue(of(prevTrack));
    
    component.track = mockTrack;
    component.previousTrack();
    tick();
    
    expect(mockIndexedDbService.getPreviousTrack).toHaveBeenCalledWith(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/tracks/3']);
  }));
});