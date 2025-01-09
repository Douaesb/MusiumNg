import { TestBed } from '@angular/core/testing';
import { IndexedDbService } from './indexed-db.service';
import { of } from 'rxjs';

describe('IndexedDbService', () => {
  let service: IndexedDbService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      add: jasmine.createSpy('add').and.returnValue(Promise.resolve(1)),
      get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ fileBlob: new Blob(), fileName: 'test.mp3', fileSize: 1024, fileType: 'audio/mp3', createdAt: new Date() })),
      getAll: jasmine.createSpy('getAll').and.returnValue(Promise.resolve([{ id: 1, title: 'Test Track', artist: 'Test Artist', category: 'Pop', duration: 3, createdAt: new Date() }])),
      delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
      put: jasmine.createSpy('put').and.returnValue(Promise.resolve(1)),
    };

    TestBed.configureTestingModule({
      providers: [
        IndexedDbService
      ]
    });

    service = TestBed.inject(IndexedDbService);

    service['db'] = mockDb;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addAudioFile', () => {
    it('should add an audio file and return an id', (done) => {
      const audioFile = {
        fileBlob: new Blob(),
        fileName: 'test.mp3',
        fileType: 'audio/mp3',
        fileSize: 1024
      };

      service.addAudioFile(audioFile).subscribe(id => {
        expect(id).toBe(1);
        expect(mockDb.add).toHaveBeenCalledWith('audioFiles', jasmine.objectContaining(audioFile));
        done();
      });
    });
  });

  describe('getAudioFileUrl', () => {
    it('should return a URL for an audio file', (done) => {
      const audioFileId = 1;

      service.getAudioFileUrl(audioFileId).subscribe(url => {
        expect(url).toBeTruthy();
        expect(mockDb.get).toHaveBeenCalledWith('audioFiles', audioFileId);
        done();
      });
    });
  });

  describe('updateTrack', () => {
    it('should update track with new audio and image files', (done) => {
      const track = { id: 1, title: 'Test Track', artist: 'Test Artist', category: 'Pop', duration: 3, createdAt: new Date() };
      const newAudioFile = { fileBlob: new Blob(), fileName: 'new-audio.mp3', fileType: 'audio/mp3', fileSize: 2048 };
      const newImageFile = { fileBlob: new Blob(), fileName: 'new-image.jpg', fileType: 'image/jpeg', fileSize: 1024 };

      service.updateTrack(track, newAudioFile, newImageFile).subscribe((id) => {
        expect(id).toBe(1); 
        expect(mockDb.put).toHaveBeenCalled();
        done();
      });
    });

    it('should throw an error if track description exceeds 200 characters', (done) => {
      const track = { id: 1, title: 'Test Track', artist: 'Test Artist', description: 'a'.repeat(201), category: 'Pop', duration: 3, createdAt: new Date() };

      service.updateTrack(track).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.message).toBe('Description exceeds 200 characters');
          done();
        }
      });
    });
  });
});
