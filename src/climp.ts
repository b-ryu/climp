import type {ClimpConfig} from './types';

export default function (config: ClimpConfig) {
  console.log(config);

  return (args: string[]) => {
    console.log(args);

    return '';
  };
}
