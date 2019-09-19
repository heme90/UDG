pipeline {
  agent any
  stages {
    stage('test') {
      parallel {
        stage('test') {
          steps {
            echo 'test'
          }
        }
        stage('mail') {
          steps {
            mail(to: 'dbsrl0423@gmail.com', from: 'jenkins', body: 'mail from jenkins', subject: 'notice')
          }
        }
      }
    }
  }
}