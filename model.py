from keras.applications.mobilenetv2 import MobileNetV2
from keras.layers import Dense, Dropout, Reshape, GlobalMaxPooling2D, GlobalAveragePooling2D
from keras.models import Model

def CreateModel():
  ALPHA = 1.0
  base_model = MobileNetV2(input_shape=(128,128,3), alpha=ALPHA, include_top=False, pooling='avg')
  output = Dense(1, activation='sigmoid')(base_model.output)
  return Model(inputs=base_model.input, outputs=output)

  
