
import { FirestorePermissionError } from './errors';

type Listener = (error: FirestorePermissionError) => void;

class ErrorEmitter {
  private listeners: Set<Listener> = new Set();

  on(event: 'permission-error', listener: Listener) {
    this.listeners.add(listener);
  }

  removeListener(event: 'permission-error', listener: Listener) {
    this.listeners.delete(listener);
  }

  emit(event: 'permission-error', error: FirestorePermissionError) {
    this.listeners.forEach(listener => listener(error));
  }
}

export const errorEmitter = new ErrorEmitter();
