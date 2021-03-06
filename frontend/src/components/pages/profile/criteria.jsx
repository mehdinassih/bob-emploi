import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {Colors, Select, CheckboxList, FieldSet, IconInput} from 'components/theme'
import {PROJECT_EMPLOYMENT_TYPE_OPTIONS, PROJECT_WORKLOAD_OPTIONS} from 'store/project'
import {Step} from './step'
import {setUserProfile} from 'store/actions'


class NewProjectCriteriaStep extends React.Component {
  static propTypes = {
    newProject: PropTypes.object,
    onSubmit: PropTypes.func,
  }
  static contextTypes = {
    isMobileVersion: PropTypes.bool.isRequired,
  }

  componentWillMount() {
    const {employmentTypes, minSalary, workloads} = this.props.newProject
    this.setState({employmentTypes, minSalary, workloads})
  }

  handleSubmit = () => {
    const {onSubmit} = this.props
    const {employmentTypes, minSalary, workloads} = this.state
    this.setState({isValidated: true})
    if (this.isFormValid()) {
      onSubmit && onSubmit({employmentTypes, minSalary, workloads})
    }
  }

  handleChange = field => event => {
    this.setState({[field]: event.target.value})
  }

  handleValueChange = field => value => {
    this.setState({[field]: value})
  }

  fastForward = () => {
    const {employmentTypes, minSalary, workloads} = this.state
    if (this.isFormValid()) {
      this.handleSubmit()
      return
    }
    const newState = {}
    if (!(employmentTypes || []).length) {
      newState.employmentTypes = ['CDI']
    }
    if (!(workloads || []).length) {
      newState.workloads = ['FULL_TIME']
    }
    if (!minSalary) {
      newState.minSalary = 21500
    }
    this.setState(newState)
  }

  isFormValid = () => {
    const {employmentTypes, workloads} = this.state
    return !!((employmentTypes || []).length > 0 &&
              (workloads || []).length > 0)
  }

  render() {
    const {isMobileVersion} = this.context
    const {minSalary, employmentTypes, workloads, isValidated} = this.state
    const checkboxListContainerStyle = {
      display: 'flex',
      flexDirection: isMobileVersion ? 'column' : 'row',
      justifyContent: 'space-between',
    }
    return <Step
      title="Quels sont vos critères ?"
      {...this.props} fastForward={this.fastForward}
      onNextButtonClick={this.handleSubmit}>
      <FieldSet
        label="Je cherche un poste en :"
        isValid={!!(employmentTypes || []).length && !!(workloads || []).length}
        isValidated={isValidated}>
        <div style={checkboxListContainerStyle}>
          <CheckboxList
            options={PROJECT_EMPLOYMENT_TYPE_OPTIONS}
            values={employmentTypes}
            onChange={this.handleValueChange('employmentTypes')} />
          <CheckboxList
            options={PROJECT_WORKLOAD_OPTIONS}
            values={workloads}
            onChange={this.handleValueChange('workloads')} />
        </div>
      </FieldSet>
      <FieldSet label="Pour un salaire de :">
        <SalaryInput value={minSalary} onChange={this.handleValueChange('minSalary')} />
        <p style={{color: Colors.COOL_GREY, fontSize: 15, lineHeight: 1.3}}>
          (laissez vide si vous n'avez pas d'idée précise)
        </p>
      </FieldSet>
    </Step>
  }
}

const SALARY_UNIT_OPTIONS = [
  {name: 'brut par an', value: 'ANNUAL_GROSS_SALARY'},
  {name: 'net par mois', value: 'MONTHLY_NET_SALARY'},
  {name: 'net par heure', value: 'HOURLY_NET_SALARY'},
]


const TO_GROSS_ANNUAL_FACTORS = {
  // net = gross x 80%
  ANNUAL_GROSS_SALARY: 1,
  HOURLY_NET_SALARY: 52 * 35 / 0.8,
  MONTHLY_NET_SALARY: 12 / 0.8,
}


class SalaryInputBase extends React.Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    unitValue: PropTypes.string.isRequired,
    value: PropTypes.number,
  }
  static contextTypes = {
    isMobileVersion: PropTypes.bool.isRequired,
  }

  state = {
    // String value.
    salaryValue: null,
  }

  componentWillMount() {
    this.setSalaryValue(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setSalaryValue(nextProps)
    }
  }

  setSalaryValue = ({unitValue, value}) => {
    if (!value) {
      this.setState({salaryValue: ''})
      return
    }
    const factor = TO_GROSS_ANNUAL_FACTORS[unitValue]
    this.setState({salaryValue: (value / factor).toLocaleString('fr')})
  }

  handleSalaryValueChange = value => {
    this.setState({salaryValue: value}, () => {
      this.handleChange(this.props.unitValue)
    })
  }

  handleSalaryUnitChange = salaryUnit => {
    this.props.dispatch(setUserProfile({
      preferredSalaryUnit: salaryUnit,
    }, true))
    this.handleChange(salaryUnit)
  }

  handleChange = salaryUnit => {
    const {onChange} = this.props
    const salaryValueString = this.state.salaryValue
    if (!salaryValueString) {
      onChange(0)
      return
    }
    const cleanSalaryValueString = salaryValueString.replace(/[^0-9,.\xa0]/g, '')
    const salaryValue = parseFloat(cleanSalaryValueString.replace(/\xa0/g, '').replace(',', '.'))
    const factor = TO_GROSS_ANNUAL_FACTORS[salaryUnit]
    const grossAnnualValue = Math.round(salaryValue * factor)
    if (salaryValueString !== cleanSalaryValueString) {
      this.setSalaryValue({unitValue: salaryUnit, value: grossAnnualValue})
    }
    onChange(grossAnnualValue)
  }

  render() {
    const {unitValue} = this.props
    const {isMobileVersion} = this.context
    const {salaryValue} = this.state
    return <div style={{display: 'flex', flexDirection: isMobileVersion ? 'column' : 'row'}}>
      <IconInput
        iconName="currency-eur" iconStyle={{paddingTop: 5}}
        placeholder="Montant" inputStyle={{paddingRight: '2.1em', textAlign: 'right'}}
        value={salaryValue} onChange={this.handleSalaryValueChange} />
      <Select
        options={SALARY_UNIT_OPTIONS} value={unitValue}
        onChange={this.handleSalaryUnitChange}
        isEmptyDisabled={true}
        style={{[isMobileVersion ? 'marginTop' : 'marginLeft']: 10}} />
    </div>
  }
}
const SalaryInput = connect(({user}) => ({
  unitValue: user.profile.preferredSalaryUnit || 'ANNUAL_GROSS_SALARY',
}))(SalaryInputBase)


export {NewProjectCriteriaStep}
