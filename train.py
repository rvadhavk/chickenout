from model import CreateModel
from data import LoadData
from keras.callbacks import ModelCheckpoint
import tensorflowjs as tfjs
import matplotlib.pyplot as plt

model = CreateModel()
model.compile(optimizer='sgd', loss='binary_crossentropy', metrics=['binary_accuracy'])
training_data, validation_data = LoadData()
#
## train model
#save_model = ModelCheckpoint('model.h5', save_best_only=True, save_weights_only=True, verbose=1)
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
