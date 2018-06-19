from keras.applications.mobilenetv2 import preprocess_input
import os
from keras.preprocessing.image import load_img, img_to_array
from model import CreateModel
import numpy as np

img = img_to_array(load_img(os.sys.argv[1], target_size=(128,128)).convert('RGB'))
img = preprocess_input(img)
batch = np.expand_dims(img, axis=0)
model = CreateModel()
model.load_weights('model.h5')
predictions = model.predict(batch)
print(predictions[0])
