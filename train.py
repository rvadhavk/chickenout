from model import CreateModel
from keras.applications.mobilenet import preprocess_input
from keras.preprocessing.image import ImageDataGenerator, array_to_img
from keras.callbacks import ModelCheckpoint
import tensorflowjs as tfjs
import matplotlib.pyplot as plt

# load data
data_generator = ImageDataGenerator(
  preprocessing_function=preprocess_input,
  validation_split=0.3,
  #rotation_range=40,
  width_shift_range=0.2,
  height_shift_range=0.2,
  #shear_range=0.2,
  zoom_range=0.2,
  horizontal_flip=True,
  #fill_mode='nearest'
)
training_data, validation_data  = (data_generator.flow_from_directory(
  'data',
  subset=subset,
  classes=['not_chickens','chickens'],
  target_size=(128,128),
  batch_size=16,
  class_mode='binary') for subset in ('training', 'validation')
)
model = CreateModel()
model.compile(optimizer='sgd', loss='binary_crossentropy', metrics=['binary_accuracy'])
#
## train model
#save_model = ModelCheckpoint('model_checkpoint.hd5f', save_best_only=True, save_weights_only=True, verbose=1)
#print(f'data generator length: {len(training_data)}')
#model.fit_generator(
#        training_data,
#        validation_data=validation_data,
#        epochs=2,
#        callbacks=[save_model])
#
## fine tuning
#for layer in base_model.layers[:-5]:
#  layer.trainable = False
#model.compile(optimizer='sgd', loss='binary_crossentropy', metrics=['binary_accuracy'])
#model.fit_generator(
#        training_data,
#        validation_data=validation_data,
#        epochs=2,
#        callbacks=[save_model])
## save model
#tfjs.converters.save_keras_model(model, 'extension/model')
#
