from keras.applications.mobilenet import MobileNet, preprocess_input
from keras.layers import Dense, Dropout, Reshape, GlobalMaxPooling2D
from keras.models import Model

def CreateModel():
  ALPHA = 1.0
  DROPOUT = 1e-3
  base_model = MobileNet(input_shape=(128,128,3), alpha=ALPHA, include_top=False)
  x = base_model.output
  x = GlobalMaxPooling2D()(x)
  x = Reshape((int(1024 * ALPHA),), name='reshape_1')(x)
  x = Dropout(DROPOUT, name='dropout')(x)
  output = Dense(1, activation='sigmoid')(x)
  return Model(inputs=base_model.input, outputs=output)

  
