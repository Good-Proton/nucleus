import * as fs from 'fs-extra';
import * as path from 'path';
import * as debug from 'debug';


const d = debug('nucleus:sync');

export const syncDirectoryToStore = async (store: IFileStore, keyPrefix: string, localBaseDir: string, relative: string = '.', needOverwrite?: (s:string) => boolean) => {
  for (const child of await fs.readdir(path.resolve(localBaseDir, relative))) {
    const absoluteChild = path.resolve(localBaseDir, relative, child);
    if ((await fs.stat(absoluteChild)).isDirectory()) {
      await syncDirectoryToStore(store, keyPrefix, localBaseDir, path.join(relative, child), needOverwrite);
    } else {

      let overwrite;
      if(needOverwrite){
        overwrite = needOverwrite(child);
      } else {
        overwrite = true;
      }

      d(`syncDirectoryToStore called, typeof needOverwrite=${typeof needOverwrite}, child='${child}, overwrite='${overwrite}`);

      await store.putFile(
        path.posix.join(keyPrefix, relative, child),
        await fs.readFile(absoluteChild),
        overwrite,
      );
    }
  }
};

export const syncStoreToDirectory = async (store: IFileStore, keyPrefix: string, localDir: string) => {
  for (const key of await store.listFiles(keyPrefix)) {
    const relativeKey = key.substr(keyPrefix.length + 1);
    const localPath = path.resolve(localDir, relativeKey);
    await fs.mkdirs(path.dirname(localPath));
    await fs.writeFile(
      localPath,
      await store.getFile(key),
    );
  }
};
