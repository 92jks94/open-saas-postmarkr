import Lob from 'lob';
import { requireNodeEnvVar } from '../utils';

export const lob = new Lob(requireNodeEnvVar('LOB_API_KEY'));
