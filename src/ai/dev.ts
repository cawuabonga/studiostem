
// Flows will be imported for their side effects in this file.

// Load environment variables from .env file
import 'dotenv/config';

// Import your flows here to make them available in the development environment
import './flows/generate-syllabus-summary-flow';
import './flows/generate-unit-image-flow';
import './flows/process-access-attempt-flow';
import './flows/update-access-stats-flow';
