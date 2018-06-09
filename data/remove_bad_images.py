from PIL import Image
import os
for directory in ('chickens', 'not_chickens'):
  image_paths = os.listdir(directory)
  for path in image_paths:
    try:
      image = Image.open(path)
      image.close()
    except IOError:
      os.remove(os.path.join(directory, path))
  
