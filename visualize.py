from model import CreateModel
from keras import backend as K
from keras.layers import Input
from keras.engine.topology import Layer
from keras.models import Model
from PIL import Image
from keras.preprocessing.image import img_to_array
from keras.applications.mobilenetv2 import preprocess_input
import numpy as np
import matplotlib.pyplot as plt
import os
import cv2
import keras.activations as activations

# load image
img = Image.open(os.sys.argv[1]).resize((128,128)).convert('RGB')
img = img_to_array(img)
preprocessed_img = preprocess_input(img.copy())
batch = np.expand_dims(preprocessed_img, axis=0)

# get the last 8x8 conv layer of model
classifier = CreateModel()
classifier.load_weights('model.h5')
conv_layer = classifier.get_layer('Conv_1')

# compute activation map
gradient_var = K.gradients(classifier.output, conv_layer.output)[0]
activation_map_var = K.sum(gradient_var * conv_layer.output, axis=3)
activation_map = K.function([classifier.input], [activation_map_var])([batch])[0][0]
activation_map -= activation_map.min()
activation_map /= activation_map.max()
plt.imshow(img/255)
plt.imshow(activation_map, cmap=plt.cm.PiYG, extent=(0,128,128,0), alpha=0.8, interpolation=None)
plt.show()

