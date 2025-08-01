import PectoralisMajor from '../assets/icons/workout/pectoralisMajor.svg';
import Back from '../assets/icons/workout/Lattisimusdorsi.svg';
import Biceps from '../assets/icons/workout/Biceps.svg';
import Hamstrings from '../assets/icons/workout/Bicepsfermoris.svg';
import Forearm from '../assets/icons/workout/Brachioradialis.svg';
import Deltoid from '../assets/icons/workout/Deltoids.svg';
import Calf from '../assets/icons/workout/Gastrocnemius.svg';
import Glutes from '../assets/icons/workout/Gluteusmaximus.svg';
import Abs from '../assets/icons/workout/Rectusabdominus.svg';
import Quads from '../assets/icons/workout/Rectusfemoris.svg';
import Triceps from '../assets/icons/workout/Triceps.svg';
import UpperBack from '../assets/icons/workout/Trapezius.svg';
import MiddleBack from '../assets/icons/workout/MiddleBack.svg';
import LowerBack from '../assets/icons/workout/LowerBack.svg';
import LowerLBack from '../assets/icons/workout/lowerlowerback.svg';
import Brachior from '../assets/icons/workout/Brachioradialis.svg';
import trilong from '../assets/icons/workout/trilong.svg';
import trimedial from '../assets/icons/workout/trimedial.svg';

// Import other SVG icons here as you add them

export const WorkoutIcons = {
  pectoralisMajor: PectoralisMajor,
  back: Back,
  biceps: Biceps,
  hamstrings: Hamstrings,
  forearm: Forearm,
  deltoid: Deltoid,
  abs: Abs,
  glutes: Glutes,
  calf: Calf,
  quads: Quads,
  upperBack: UpperBack,
  triceps: Triceps,
  middleBack: MiddleBack,
  lowerBack:LowerBack,
  lowerlowerBack:LowerLBack,
  brachior:Brachior,
  trilong:trilong,
  trimedial:trimedial,
  
  // Add other icon mappings here, e.g.:
  // biceps: BicepsIcon,
  // triceps: TricepsIcon,
};

export type WorkoutIconName = keyof typeof WorkoutIcons;