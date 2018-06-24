from keras.applications.mobilenetv2 import MobileNetV2
from keras.layers import Dense
from keras.models import Model
from keras import backend as K


def CreateModel():
  ALPHA = 1.0
  K.set_learning_phase(0)
  base_model = MobileNetV2(input_shape=(128,128,3), alpha=ALPHA, include_top=False, pooling='avg')
  K.set_learning_phase(1)
  output = Dense(1, activation='sigmoid')(base_model.output)
  model = Model(inputs=base_model.input, outputs=output)
  model.base = base_model
  return model
