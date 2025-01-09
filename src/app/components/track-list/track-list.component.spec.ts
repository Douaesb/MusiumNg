  import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
  import { TrackListComponent } from './track-list.component';
  import { Store } from '@ngrx/store';
  import { IndexedDbService } from '../../core/services/indexed-db.service';
  import { Router } from '@angular/router';
  import { of } from 'rxjs';
  import { Track } from '../../state/track/track.models';
  import * as TrackActions from '../../state/track/track.actions';
  import { FormsModule } from '@angular/forms';
  import { CommonModule } from '@angular/common';

  describe('TrackListComponent', () => {
    let component: TrackListComponent;
    let fixture: ComponentFixture<TrackListComponent>;
    let mockStore: jasmine.SpyObj<Store>;
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

    beforeEach(async () => {
      // Create mock services
      mockStore = jasmine.createSpyObj('Store', ['dispatch', 'select']);
      mockIndexedDbService = jasmine.createSpyObj('IndexedDbService', [
        'getTrackById',
        'getAudioFileUrl',
        'getImageFileUrl',
        'addAudioFile',
        'addImageFile',
        'updateTrack',
        'deleteTrack'
      ]);
      mockRouter = jasmine.createSpyObj('Router', ['navigate']);

      // Setup mock responses
      mockStore.select.and.returnValue(of([mockTrack]));
      mockIndexedDbService.getAudioFileUrl.and.returnValue(of('test-url'));
      mockIndexedDbService.getImageFileUrl.and.returnValue(of('test-image-url'));
      mockIndexedDbService.addAudioFile.and.returnValue(of(1));
      mockIndexedDbService.addImageFile.and.returnValue(of(1));
      mockIndexedDbService.updateTrack.and.returnValue(of(1));  
      mockIndexedDbService.deleteTrack.and.returnValue(of(void 0));  
      

      await TestBed.configureTestingModule({
        imports: [TrackListComponent, FormsModule, CommonModule],
        providers: [
          { provide: Store, useValue: mockStore },
          { provide: IndexedDbService, useValue: mockIndexedDbService },
          { provide: Router, useValue: mockRouter },
        ]
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(TrackListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load tracks on initialization', fakeAsync(() => {
      component.ngOnInit();
      tick();
      expect(mockStore.dispatch).toHaveBeenCalledWith(TrackActions.loadTracks());
    }));

    it('should open create modal', () => {
      component.openCreateModal();
      expect(component.crudModal.nativeElement.classList).not.toContain('hidden');
    });

    it('should close create modal', () => {
      component.closeCreateModal();
      expect(component.crudModal.nativeElement.classList).toContain('hidden');
    });

    it('should open edit modal with selected track', () => {
      component.openEditModal(mockTrack);
      expect(component.selectedTrack).toEqual(mockTrack);
    });

    it('should close edit modal', () => {
      component.closeEditModal();
      expect(component.selectedTrack).toBeNull();
    });
  

    it('should handle file change for audio file', () => {
      const file = new File([''], 'audio.mp3', { type: 'audio/mp3' });
      const event = { target: { files: [file] } };
      component.onAudioFileChange(event as unknown as Event);
      expect(component.audioFile).toBeDefined();
      expect(component.audioFileUrl).toBeDefined();
    });

    it('should handle image file change for update', () => {
      const file = new File([''], 'image.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [file] } };
      component.onImageFileChange(event as unknown as Event, true);
      expect(component.newImageFile).toBeDefined();
    });

    it('should delete track', () => {
      if (mockTrack.id !== undefined) {
        component.deleteTrack(mockTrack.id);
      }
      expect(mockStore.dispatch).toHaveBeenCalledWith(TrackActions.deleteTrack({ trackId: mockTrack.id! }));
    });

    it('should navigate to track details when track is selected', () => {
      component.selectTrack(mockTrack);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tracks', mockTrack.id]);
    });

  });
